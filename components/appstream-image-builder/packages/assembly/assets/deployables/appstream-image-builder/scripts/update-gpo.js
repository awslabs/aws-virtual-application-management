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

#!/usr/bin/env node
/* eslint-disable no-console */
// @ts-check

// until node14
require('regenerator-runtime/runtime');

const stream = require('stream');
const path = require('path');
const { pushd, popd, cp, cat, mkdir } = require('shelljs');
const archiver = require('archiver');
const chalk = require('chalk');
const { retry } = require('@aws-ee/base-services');
const {
  initPackageManager,
  solutionDir,
  stage,
  solutionName,
  findSplitAndSanitize,
  getCfnOutput,
  s3Client,
  getClientSdk,
  configDir,
} = require('./util');

process.on('unhandledRejection', error => {
  console.log('Error: ', error);
  process.exit(1);
});

const log = message => console.log(`[update-gpo-scripts] ${chalk.yellowBright(message)}`);

const wait = seconds => new Promise(resolve => setTimeout(resolve, seconds * 1000));

const zipDirectoryToS3 = ({ sourceDirectory, bucket, key }) => {
  const archive = archiver('zip', { zlib: { level: 9 } });
  const uploadStream = new stream.PassThrough();
  const output = s3Client.upload({ Bucket: bucket, Key: key, Body: uploadStream }).promise();

  return new Promise((resolve, reject) => {
    archive
      // Add all files in this directory as root objects in the zip
      .directory(sourceDirectory, false)
      .on('error', reject)
      .pipe(uploadStream);

    archive.finalize();
    output.then(data => resolve(data));
  });
};

/** @type {AWS.SSM} */
const ssmClient = getClientSdk({ clientName: 'SSM' });

const ssmTerminalStatuses = ['Success', 'Cancelled', 'TimedOut', 'Failed'];

const executeViaSSM = async ({ instanceID, script }) => {
  const params = {
    DocumentName: 'AWS-RunPowerShellScript',
    CloudWatchOutputConfig: { CloudWatchOutputEnabled: true },
    InstanceIds: [instanceID],
    Parameters: {
      commands: [`${script}`],
    },
  };

  const res = await ssmClient.sendCommand(params).promise();
  return res.Command.CommandId;
};

/**
 * Execute command via SSM and then wait for completion, logging output.
 * @param {{instanceID: string, script: string, title: string}} params
 */
const executeSsmAndWait = async ({ instanceID, script, title }) => {
  // SSM can't execute until the agent is running. So retry with exponential backoff.
  const commandId = await retry(() => executeViaSSM({ instanceID, script }), 10);

  log(`Running ${title} - command Id: ${commandId}`);
  // The command being checkable by getCommandInvocation seems eventually consistent, so wait a bit.
  await wait(10);

  while (
    !ssmTerminalStatuses.includes(
      (
        await ssmClient // eslint-disable-line no-await-in-loop
          .getCommandInvocation({
            InstanceId: instanceID,
            CommandId: commandId,
          })
          .promise()
      ).Status,
    )
  ) {
    await wait(10); // eslint-disable-line no-await-in-loop
    process.stdout.write('.');
  }
  process.stdout.write('\n');

  const finalResult = await ssmClient.getCommandInvocation({ InstanceId: instanceID, CommandId: commandId }).promise();

  log(`StdOut: ${finalResult.StandardOutputContent}`);
  log(`StdErr: ${finalResult.StandardErrorContent}`);
  log(`Terminated with status ${finalResult.Status}`);
  return finalResult;
};

const installSoftwareAndUpdateGpo = async () => {
  const { exec } = initPackageManager();

  log('Installing software and updating GPO...');

  pushd('-q', path.join(solutionDir, 'appstream-image-builder'));
  const stackNameImageBuilder = findSplitAndSanitize({
    input: exec(`sls info -s "${stage}"`, { silent: true }),
    search: 'stack:',
  });
  popd('-q');

  const gpoTemplateBucket = await getCfnOutput({ stackName: stackNameImageBuilder, key: 'GPOTemplateBucket' });
  const installerHostInstanceID = await getCfnOutput({
    stackName: stackNameImageBuilder,
    key: 'InstallerHostInstanceID',
  });

  const buildDirectory = path.join(solutionDir, 'appstream-image-builder', '.build');
  mkdir('-p', buildDirectory);

  cp(
    '-r',
    path.join(solutionDir, 'appstream-image-builder', 'data', '{56E694B8-4C08-4594-B9AC-8FE030640822}'),
    buildDirectory,
  );

  const psFile = path.join(
    '{56E694B8-4C08-4594-B9AC-8FE030640822}',
    'DomainSysvol',
    'GPO',
    'Machine',
    'Scripts',
    'Startup',
    'Enable-PsRemoting.ps1',
  );
  const sourcePsFile = path.join(solutionDir, 'appstream-image-builder', 'data', psFile);
  const destPsFile = path.join(buildDirectory, psFile);

  cat(sourcePsFile)
    .sed(/\$\{STAGE\}/g, stage)
    .to(destPsFile);

  await zipDirectoryToS3({
    sourceDirectory: buildDirectory,
    bucket: gpoTemplateBucket,
    key: 'gpo.zip',
  });

  log(`Domain: ${solutionName}-${stage}.com`);
  log(`GPO Bucket: ${gpoTemplateBucket}`);
  log(`GPO Zip: ${gpoTemplateBucket}/gpo.zip`);
  log('Installing now...');

  const imageBuilderADCredentialsArn = await getCfnOutput({
    stackName: stackNameImageBuilder,
    key: 'ImageBuilderADCredentialsArn',
  });

  const domain = `${solutionName}-${stage}`;

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

  const result = await executeSsmAndWait({ instanceID: installerHostInstanceID, script, title: 'GPO update script' });

  // SSM fails occasionally for various reasons. Mostly retrying works fine.
  if (result.Status !== 'Success') {
    log('Repeating SSM installation once more...');
    const secondResult = await executeSsmAndWait({
      instanceID: installerHostInstanceID,
      script,
      title: 'GPO update script',
    });
    if (secondResult.Status !== 'Success') {
      // Indicate that it went wrong to fail the pipeline.
      process.exit(1);
    }
  }
};

const installRemoteSoftware = async () => {
  log('Installing RSAT-ADDS...');

  const { exec } = initPackageManager();

  pushd('-q', path.join(solutionDir, 'appstream-image-builder'));
  const stackNameImageBuilder = findSplitAndSanitize({
    input: exec(`sls info -s "${stage}"`, { silent: true }),
    search: 'stack:',
  });
  popd('-q');

  const installerHostInstanceID = await getCfnOutput({
    stackName: stackNameImageBuilder,
    key: 'InstallerHostInstanceID',
  });

  const script = `
  Install-WindowsFeature RSAT-ADDS
  `;

  const result = await executeSsmAndWait({ instanceID: installerHostInstanceID, script, title: 'GPO update script' });

  // SSM fails occasionally for various reasons. Mostly retrying works fine.
  if (result.Status !== 'Success') {
    log('Repeating RSAT-ADDS installation once more...');
    const secondResult = await executeSsmAndWait({
      instanceID: installerHostInstanceID,
      script,
      title: 'GPO update script',
    });
    if (secondResult.Status !== 'Success') {
      // Indicate that it went wrong to fail the pipeline.
      process.exit(1);
    }
  }
};

const run = async () => {
  const _settings = cat(path.join(configDir, 'settings', `${stage}.yml`));
  const dnsIpAddresses = findSplitAndSanitize({ input: _settings, search: '^dnsIpAddresses:' });
  const directoryId = findSplitAndSanitize({ input: _settings, search: '^directoryId:' }) || 'us-east-1';
  const appStreamServiceAccountSecretArn = findSplitAndSanitize({
    input: _settings,
    search: '^appStreamServiceAccountSecretArn:',
  });
  const imageBuilderServiceAccountSecretArn = findSplitAndSanitize({
    input: _settings,
    search: '^imageBuilderServiceAccountSecretArn:',
  });

  if (dnsIpAddresses && directoryId && appStreamServiceAccountSecretArn && imageBuilderServiceAccountSecretArn) {
    await installRemoteSoftware();
  } else {
    await installSoftwareAndUpdateGpo();
  }
};

run();
