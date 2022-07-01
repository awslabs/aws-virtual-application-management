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

import _ from 'lodash';

import { StepBase } from '@aws-ee/base-workflow-core';
import { imageBuilderInstallViaSSM, OutputSelectionMarker } from '../../execute-via-ssm';
import { waitForExecution, CommandStatus } from '../../util';

const inPayloadKeys = {
  imageBuilderID: 'imageBuilderID',
  installerHostInstanceID: 'installerHostInstanceID',
  dapEnabled: 'dapEnabled',
  packageName: 'packageName',
  applicationName: 'applicationName',
  applicationDisplayName: 'applicationDisplayName',
  applicationExePath: 'applicationExePath',
  applicationVersion: 'applicationVersion',
};

const payloadKeys = {
  commandID: 'commandID',
};

const settingsKeys = {
  adDomainName: 'adDomainName',
  ou: 'ou',
  imageBuilderADCredentialsArn: 'imageBuilderADCredentialsArn',
  installerHostWorkBucketName: 'installerHostWorkBucketName',
};

class InstallViaChoco extends StepBase {
  async start() {
    const settings = await this.mustFindServices('settings');
    const adDomainName = settings.get(settingsKeys.adDomainName);
    const imageBuilderADCredentialsArn = settings.get(settingsKeys.imageBuilderADCredentialsArn);
    const installerHostWorkBucketName = settings.get(settingsKeys.installerHostWorkBucketName);
    const ou = settings.get(settingsKeys.ou);

    const [
      imageBuilderID,
      installerHostInstanceID,
      dapEnabled,
      packageName,
      applicationName,
      applicationDisplayName,
      applicationExePath,
      applicationVersion,
    ] = await Promise.all([
      this.payloadOrConfig.string(inPayloadKeys.imageBuilderID),
      this.payloadOrConfig.string(inPayloadKeys.installerHostInstanceID),
      this.payloadOrConfig.boolean(inPayloadKeys.dapEnabled),
      this.payloadOrConfig.string(inPayloadKeys.packageName),
      this.payloadOrConfig.string(inPayloadKeys.applicationName),
      this.payloadOrConfig.string(inPayloadKeys.applicationDisplayName),
      this.payloadOrConfig.string(inPayloadKeys.applicationExePath),
      this.payloadOrConfig.string(inPayloadKeys.applicationVersion),
    ]);

    const commandID = await imageBuilderInstallViaSSM({
      instanceID: installerHostInstanceID,
      imageBuilderID,
      workBucket: installerHostWorkBucketName,
      domain: adDomainName,
      ou,
      domainCredentialsArn: imageBuilderADCredentialsArn,
      applicationExePath,
      script: `
        $Env:Path += ';C:\\Program Files\\Amazon\\Photon\\ConsoleImageBuilder\\'

        if (!(Test-Path "C:\\ProgramData\\chocolatey")) {
          Set-ExecutionPolicy Bypass -Scope Process -Force
          [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
          $squelch = iex ((New-Object System.Net.WebClient).DownloadString("https://chocolatey.org/install.ps1"))
        }
        $chocoOutput = C:\\ProgramData\\chocolatey\\bin\\choco.exe install ${packageName} -y --version ${applicationVersion}
        $chocoStatus = $LASTEXITCODE

        if ($${dapEnabled}) {
          Write-Host "Skipping add-application for ${applicationName} (dap enabled)"
          $imOutput = '{"status": 0}'
        } else {
          $imOutput = image-assistant.exe add-application --name "${applicationName}" --absolute-app-path "${applicationExePath}" --display-name "${applicationDisplayName}"
        }

        $installedExe = Test-Path "${applicationExePath}"

        New-Object -TypeName PSCustomObject -Property @{IMOutput=$imOutput; PType="choco"; ChocoStatus=$chocoStatus; ChocoOutput=$chocoOutput; InstalledExe=$installedExe}
      `,
    });

    await this.payload.setKey(payloadKeys.commandID, commandID);

    return this.wait(5)
      .maxAttempts(3600)
      .until('commandFinished');
  }

  // wait until the execution succeeds
  async commandFinished() {
    const instanceID = await this.payloadOrConfig.string(inPayloadKeys.installerHostInstanceID);
    const commandID = await this.payloadOrConfig.string(payloadKeys.commandID);
    const aws = await this.mustFindServices('aws');
    const result = await waitForExecution({ instanceID, commandID, aws, log: (...args) => this.print(args) });

    if (result !== null) {
      // if the command has terminated but failed
      if (result.Status !== CommandStatus.Success) {
        this.print('RESULT', result);
        const msg = result.StandardOutputContent;
        const outputSelection = new RegExp(OutputSelectionMarker, 'm');
        const parts = msg.split(outputSelection);

        if (parts.length > 1 && !_.isEmpty(_.trim(parts[1]))) {
          // output as per PS script logic
          throw new Error(parts[1]);
        } else {
          // PS script failure
          throw new Error(result.StandardErrorContent);
        }
      }

      // if the command has terminated and succeeded, just return
      return true;
    }

    // not terminated yet
    return false;
  }

  inputKeys() {
    return {
      [inPayloadKeys.imageBuilderID]: 'string',
      [inPayloadKeys.dapEnabled]: 'boolean',
      [inPayloadKeys.packageName]: 'string',
      [inPayloadKeys.applicationName]: 'string',
      [inPayloadKeys.applicationExePath]: 'string',
      [inPayloadKeys.applicationVersion]: 'string',
    };
  }

  outputKeys() {
    return {};
  }
}

export default InstallViaChoco;
