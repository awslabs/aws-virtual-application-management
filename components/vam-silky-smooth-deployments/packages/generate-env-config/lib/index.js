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
import fs from 'fs';
import crypto from 'crypto';
// import slsSettingsHelper from '@aws-ee/base-serverless-settings-helper';
import { promisify } from 'util';
import { awsHelper } from '@aws-ee/base-script-utils';

const writeFile = promisify(fs.writeFile);

const config = ({
  awsRegion,
  solutionName,
  envName,
  adminUserEmail,
  adminUserFirstName,
  adminUserLastName,
  adJoined,
  gSuiteDomains,
  embedHosts,
  vpcId,
  subnetIds,
  availabilityZones,
  fedIdpIds: _fedIdpIds,
  fedIdpNames,
  fedIdpDisplayNames,
  fedIdpMetadatas,
  adDomain,
  adDomainName,
  ou,
  dnsIpAddresses,
  directoryId,
  appStreamServiceAccountSecretArn,
  imageBuilderServiceAccountSecretArn,
  deployAppStreamDirectoryConfig,
}) => `
awsRegion: ${awsRegion}

solutionName: ${solutionName}

envName: ${envName}

useCmkDynamoDbEncryption: true

adminPrincipals: '[{"email": "${adminUserEmail}", "firstName": "${adminUserFirstName}", "lastName": "${adminUserLastName}"}]'

adJoined: ${adJoined || false}

deployAppStreamDirectoryConfig: ${deployAppStreamDirectoryConfig || true}

gsuiteDomains: ${gSuiteDomains || "''"}

embedHosts: ${embedHosts || "''"}

vpcId: ${vpcId || "''"}

subnetIds: ${subnetIds || "''"}

usePrivateApi: 'false'

availabilityZones: ${availabilityZones || "''"}

${fedIdpNames ? `fedIdpIds: '["${fedIdpNames.replace(/[^\w\s+=.@-]/g, '').slice(0, 32)}"]'` : ''}
${fedIdpNames ? `fedIdpNames: '["${fedIdpNames}"]'` : ''}
${fedIdpDisplayNames ? `fedIdpDisplayNames: '["${fedIdpDisplayNames}"]'` : ''}
${fedIdpMetadatas ? `fedIdpMetadatas: '["${fedIdpMetadatas}"]'` : ''}
${
  fedIdpMetadatas
    ? `fedIdpS3SamlMetadataArns: '${
        fedIdpMetadatas.startsWith('s3://') ? `arn:aws:s3:::${fedIdpMetadatas.replace('s3://', '')}` : ''
      }'`
    : ''
}

${adDomain ? `adDomain: ${adDomain}` : ''}
${adDomainName ? `adDomainName: ${adDomainName}` : ''}
${ou ? `ou: ${ou}` : ''}
${dnsIpAddresses ? `dnsIpAddresses: ${dnsIpAddresses}` : ''}
${directoryId ? `directoryId: ${directoryId}` : ''}
${appStreamServiceAccountSecretArn ? `appStreamServiceAccountSecretArn: ${appStreamServiceAccountSecretArn}` : ''}
${
  imageBuilderServiceAccountSecretArn
    ? `imageBuilderServiceAccountSecretArn: ${imageBuilderServiceAccountSecretArn}`
    : ''
}
${dnsIpAddresses ? `numberOfDnsIpAddresses: ${dnsIpAddresses.split(',').length}` : ''}
`;

const generateUniqueSolutionName = ({ rawSolutionName, pipelineName, sourceVersion }) => {
  const hash = crypto.createHash('sha256');
  hash.update(`${pipelineName}${sourceVersion}`);
  // Get base64 hash and remove non-alphanumeric characters
  const entropy = hash
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '')
    .replace(/\//g, '');
  return `${rawSolutionName.slice(0, 5)}${entropy.toLowerCase().slice(0, 5)}`;
};

/**
 * @param {{subnetIds: string, region: string}} param0
 */
const getAZsForSubnets = async ({ subnetIds: subnetIdsString, region }) => {
  /** @type {AWS.EC2} */
  const ec2Client = awsHelper.getClientSdk({ clientName: 'EC2', options: { region } });
  const subnetIds = subnetIdsString.split(',');
  const response = await ec2Client.describeSubnets({ SubnetIds: subnetIds }).promise();
  const availabilityZones = subnetIds.map(subnetId => {
    const subnet = response.Subnets.find(s => s.SubnetId === subnetId);
    if (!subnet) {
      throw new Error(`Can't find subnet ${subnetId}`);
    }
    return subnet.AvailabilityZone;
  });
  return availabilityZones.join(',');
};

const run = async slsPlugin => {
  // const settings = await slsSettingsHelper.mergeSettings(
  //   __dirname,
  //   // eslint-disable-next-line no-template-curly-in-string
  //   ['../../../../../main/config/settings/.defaults.yml', '../../../../../main/config/settings/${stage}.yml'],
  //   {},
  // )(slsPlugin.serverless);

  // Get the required parameters from the environment.
  const {
    ENV_NAME: envName,
    AWS_REGION: awsRegion,
    SOLUTION_NAME: rawSolutionName,
    ADMIN_USER_EMAIL: adminUserEmail,
    ADMIN_USER_FIRST_NAME: adminUserFirstName,
    ADMIN_USER_LAST_NAME: adminUserLastName,
    AD_JOINED: adJoined,
    GSUITE_DOMAINS: gSuiteDomains,
    EMBED_HOSTS: embedHosts,
    VPC_ID: vpcId,
    SUBNET_IDS: subnetIds,
    PIPELINE_NAME: pipelineName,
    ADD_DEPLOYMENT_ENTROPY: addDeploymentEntropy,
    CODEBUILD_RESOLVED_SOURCE_VERSION: sourceVersion,
    DEPLOY_REGION: deployRegion,
    FED_IDP_IDS: fedIdpIds,
    FED_IDP_NAMES: fedIdpNames,
    FED_IDP_DISPLAY_NAMES: fedIdpDisplayNames,
    FED_IDP_METADATAS: fedIdpMetadatas,
    AD_DOMAIN: adDomain,
    AD_DOMAIN_NAME: adDomainName,
    OU: ou,
    DNS_IP_ADDRESSES: dnsIpAddresses,
    DIRECTORY_ID: directoryId,
    APPSTREAM_SERVICE_ACCOUNT_SECRET_ARN: appStreamServiceAccountSecretArn,
    IMAGE_BUILDER_SERVICE_ACCOUNT_SECRET_ARN: imageBuilderServiceAccountSecretArn,
    DEPLOY_APPSTREAM_DIRECTORY_CONFIG: deployAppStreamDirectoryConfig,
  } = process.env;

  const solutionName =
    addDeploymentEntropy === 'true'
      ? generateUniqueSolutionName({ rawSolutionName, pipelineName, sourceVersion })
      : rawSolutionName;

  // If subnetIds are provided, find and add the matching availability zones so the installer
  // host launches in the correct AZ.
  const availabilityZones = subnetIds ? await getAZsForSubnets({ subnetIds, region: deployRegion || awsRegion }) : '';

  const envConfig = config({
    awsRegion: deployRegion || awsRegion,
    solutionName,
    envName,
    adminUserEmail,
    adminUserFirstName,
    adminUserLastName,
    adJoined,
    gSuiteDomains,
    embedHosts,
    vpcId,
    subnetIds,
    availabilityZones,
    fedIdpIds,
    fedIdpNames,
    fedIdpDisplayNames,
    fedIdpMetadatas,
    adDomain,
    adDomainName,
    ou,
    dnsIpAddresses,
    directoryId,
    appStreamServiceAccountSecretArn,
    imageBuilderServiceAccountSecretArn,
    deployAppStreamDirectoryConfig,
  });
  slsPlugin.cli.log('Generated config:\n');
  slsPlugin.cli.log(envConfig);
  await writeFile(`main/config/settings/${envName}.yml`, envConfig);
};

export default run;
