/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://aws.amazon.com/apache2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

// @ts-check

import _ from 'lodash';
import { StepBase } from '@aws-ee/base-workflow-core';
import { awsHelper } from '@aws-ee/base-script-utils';
import { executeViaSSM } from '../../execute-via-ssm';
import { CommandStatus, waitForExecution } from '../../util';

/**
 * @typedef {import('aws-sdk')} AWS
 */

const outPayloadKeys = {
  commandID: 'commandID',
  installerHostInstanceID: 'installerHostInstanceID',
};

const settingsKeys = {
  dnsIpAddresses: 'dnsIpAddresses',
  ou: 'ou',
  directoryId: 'directoryId',
  appStreamServiceAccountSecretArn: 'appStreamServiceAccountSecretArn',
  imageBuilderServiceAccountSecretArn: 'imageBuilderServiceAccountSecretArn',
  windowsSsmParam: 'windowsSsmParam',
  activeDirectoryVPCSubnet: 'activeDirectoryVPCSubnet',
  installerInstanceSecurityGroup: 'installerInstanceSecurityGroup',
  namespace: 'namespace',
  installerHostProfile: 'installerHostProfile',
  joinADDocument: 'joinADDocument',
  gpoTemplateBucket: 'gpoTemplateBucket',
  installerHostWorkBucketName: 'installerHostWorkBucketName',
  imageBuilderADCredentialsArn: 'imageBuilderADCredentialsArn',
  adDomain: 'adDomain',
};

class PrepareImageBuilderEnvironment extends StepBase {
  async start() {
    await this.spawnInstallerHost();

    return this.wait(10)
      .maxAttempts(90)
      .until('installerHostRunning')
      .thenCall('launchSetupCommand');
  }

  async launchSetupCommand() {
    await this.launchCommand();

    return this.wait(10)
      .maxAttempts(30)
      .until('commandFinished');
  }

  async spawnInstallerHost() {
    const settings = await this.mustFindServices('settings');
    /** @type {AWS.EC2} */
    const ec2Client = awsHelper.getClientSdk({ clientName: 'EC2' });
    /** @type {AWS.SSM} */
    const ssmClient = awsHelper.getClientSdk({ clientName: 'SSM' });

    const windowsSsmParam = await settings.get(settingsKeys.windowsSsmParam);
    const response = await ssmClient.getParameter({ Name: windowsSsmParam }).promise();
    const ami = response.Parameter.Value;

    const subnetId = settings.get(settingsKeys.activeDirectoryVPCSubnet);
    const securityGroup = settings.get(settingsKeys.installerInstanceSecurityGroup);
    const namespace = settings.get(settingsKeys.namespace);
    const installerHostProfile = settings.get(settingsKeys.installerHostProfile);
    const joinADDocument = settings.get(settingsKeys.joinADDocument);

    const associationResponse = await ssmClient.listAssociations().promise();
    if (_.find(associationResponse.Associations, assoc => assoc.Name === joinADDocument) === undefined) {
      await ssmClient
        .createAssociation({
          Name: joinADDocument,
          Targets: [
            {
              Key: 'tag:Name',
              Values: [`${namespace}-installer-instance`],
            },
          ],
        })
        .promise();
    }

    const availabilityZone = await this.getAZsForSubnet({ subnetId });

    const ec2params = {
      ImageId: ami,
      InstanceType: 't3.medium',
      Placement: {
        AvailabilityZone: availabilityZone,
      },
      NetworkInterfaces: [
        {
          AssociatePublicIpAddress: true,
          SubnetId: subnetId,
          DeviceIndex: 0,
          Groups: [securityGroup],
        },
      ],
      MinCount: 1,
      MaxCount: 1,
      IamInstanceProfile: {
        Name: installerHostProfile,
      },
      TagSpecifications: [
        {
          ResourceType: 'instance',
          Tags: [
            {
              Key: 'Name',
              Value: `${namespace}-installer-instance`,
            },
          ],
        },
      ],
      MetadataOptions: {
        HttpEndpoint: enabled,
        HttpTokens: required,
      },
    };

    const ec2response = await ec2Client.runInstances(ec2params).promise();
    await this.payload.setKey(outPayloadKeys.installerHostInstanceID, ec2response.Instances[0].InstanceId);
  }

  async installerHostRunning() {
    /** @type {AWS.EC2} */
    const ec2Client = awsHelper.getClientSdk({ clientName: 'EC2' });
    const instanceID = await this.payloadOrConfig.string(outPayloadKeys.installerHostInstanceID);
    const params = { InstanceIds: [instanceID] };
    const instanceStatus = await ec2Client.describeInstanceStatus(params).promise();

    if (instanceStatus.InstanceStatuses.length > 0) {
      return instanceStatus.InstanceStatuses[0].InstanceStatus.Status !== 'initializing';
    }

    return false;
  }

  _tryGetSetting(settings, key, defaultValue = undefined) {
    let value;
    try {
      value = settings.get(key);
    } catch (_err) {
      value = defaultValue;
    }

    return value;
  }

  async launchCommand() {
    const settings = await this.mustFindServices('settings');

    const dnsIpAddresses = this._tryGetSetting(settings, settingsKeys.dnsIpAddresses);
    const directoryId = this._tryGetSetting(settings, settingsKeys.directoryId);
    const appStreamServiceAccountSecretArn = this._tryGetSetting(
      settings,
      settingsKeys.appStreamServiceAccountSecretArn,
    );
    const imageBuilderServiceAccountSecretArn = this._tryGetSetting(
      settings,
      settingsKeys.imageBuilderServiceAccountSecretArn,
    );

    let commandID;
    if (dnsIpAddresses && directoryId && appStreamServiceAccountSecretArn && imageBuilderServiceAccountSecretArn) {
      commandID = await this.installRemoteSoftware();
    } else {
      commandID = await this.installSoftwareAndUpdateGpo();
    }

    await this.payload.setKey(outPayloadKeys.commandID, commandID);
  }

  async commandFinished() {
    const instanceID = await this.payloadOrConfig.string(outPayloadKeys.installerHostInstanceID);
    const commandID = await this.payloadOrConfig.string(outPayloadKeys.commandID);
    const aws = await this.mustFindServices('aws');
    const result = await waitForExecution({ instanceID, commandID, aws, log: (...args) => this.print(args) });

    if (result !== null && result.Status === CommandStatus.Success) {
      return true;
    }

    return false;
  }

  async installSoftwareAndUpdateGpo() {
    const [aws, settings] = await this.mustFindServices(['aws', 'settings']);

    const gpoTemplateBucket = settings.get(settingsKeys.gpoTemplateBucket);
    const instanceID = await this.payloadOrConfig.string(outPayloadKeys.installerHostInstanceID);
    const logBucket = settings.get(settingsKeys.installerHostWorkBucketName);
    const imageBuilderADCredentialsArn = settings.get(settingsKeys.imageBuilderADCredentialsArn);
    const domain = settings.get(settingsKeys.adDomain);

    const script = `
    $GPODir = "c:\\temp\\gpo"

    $Domain = "${domain}"
    $GPOBucket = "${gpoTemplateBucket}"

    # Install the module that will allow the script to impersonate another user
    Install-PackageProvider -Name NuGet -MinimumVersion 2.8.5.201 -Force
    Set-PSRepository -Name 'PSGallery' -InstallationPolicy Trusted
    Install-Module -Name 'SecurityFever'

    Install-WindowsFeature RSAT-ADDS
    Install-WindowsFeature GPMC

    Remove-Item -Force -Recurse $GPODir -ErrorAction SilentlyContinue

    $userName = '${domain}\\admin'
    $secret = Get-SECSecretValue -SecretId ${imageBuilderADCredentialsArn} -Select 'SecretString' | ConvertFrom-Json
    $secStringPassword = ConvertTo-SecureString $secret.password -AsPlainText -Force
    $credObject = New-Object System.Management.Automation.PSCredential ($userName, $secStringPassword)

    Push-ImpersonationContext $credObject

    New-Item $GPODir -Type Directory
    Push-Location $GPODir
    Read-S3Object -BucketName $GPOBucket -Key gpo.zip -File gpo.zip
    Expand-Archive -Path gpo.zip

    if (!(Get-GPO -Name Imported -ErrorAction SilentlyContinue)) {
      Import-GPO -Path "c:\\temp\\gpo\\gpo" -BackupGpoName ngpo -TargetName Imported -CreateIfNeeded
      Get-GPO -Name Imported | New-GPLink -target "ou=$Domain,dc=$Domain,dc=com"
      Get-GPO -Name Imported | New-GPLink -target "ou=Computers,ou=$Domain,dc=$Domain,dc=com"
      gpupdate /force
    }

    Pop-ImpersonationContext

    Pop-Location
    `;

    const commandID = await executeViaSSM({ instanceID, script, logBucket, aws });
    return commandID;
  }

  async installRemoteSoftware() {
    const [aws, settings] = await this.mustFindServices(['aws', 'settings']);

    const instanceID = await this.payloadOrConfig.string(outPayloadKeys.installerHostInstanceID);
    const logBucket = settings.get(settingsKeys.installerHostWorkBucketName);

    const script = `
    Install-WindowsFeature RSAT-ADDS
    `;

    const commandID = await executeViaSSM({ instanceID, script, logBucket, aws });
    return commandID;
  }

  async getAZsForSubnet({ subnetId }) {
    /** @type {AWS.EC2} */
    const ec2Client = awsHelper.getClientSdk({ clientName: 'EC2' });
    const response = await ec2Client.describeSubnets({ SubnetIds: [subnetId] }).promise();
    const subnet = response.Subnets.find(s => s.SubnetId === subnetId);
    if (!subnet) {
      throw new Error(`Can't find subnet ${subnetId}`);
    }
    return subnet.AvailabilityZone;
  }

  inputKeys() {
    return {};
  }

  outputKeys() {
    return {
      [outPayloadKeys.installerHostInstanceID]: 'string',
    };
  }
}

export default PrepareImageBuilderEnvironment;
