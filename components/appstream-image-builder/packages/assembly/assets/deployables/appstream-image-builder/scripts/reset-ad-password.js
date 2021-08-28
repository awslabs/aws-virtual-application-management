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
const path = require('path');
const { pushd, popd, cat } = require('shelljs');
const chalk = require('chalk');
const {
  initPackageManager,
  solutionDir,
  configDir,
  stage,
  findSplitAndSanitize,
  getCfnOutput,
  getClientSdk,
} = require('./util');

/**
 * @typedef {import('aws-sdk')} AWS
 */

process.on('unhandledRejection', error => {
  console.log('Error: ', error);
  process.exit(1);
});

const log = message => console.log(`[reset-ad-password] ${chalk.yellowBright(message)}`);

const run = async () => {
  const { exec } = initPackageManager();
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
    log('Not running AD password reset as an existing AD is being used.');
    return;
  }

  log('Running...');

  pushd('-q', path.join(solutionDir, 'appstream-image-builder'));
  const stackNameImageBuilder = findSplitAndSanitize({
    input: exec(`sls info -s "${stage}"`, { silent: true }),
    search: 'stack:',
  });
  popd('-q');

  const imageBuilderADCredentialsArn = await getCfnOutput({
    stackName: stackNameImageBuilder,
    key: 'ImageBuilderADCredentialsArn',
  });
  const imageBuilderAdId = await getCfnOutput({
    stackName: stackNameImageBuilder,
    key: 'ImageBuilderAdId',
  });

  /** @type {AWS.SecretsManager} */
  const smClient = getClientSdk({ clientName: 'SecretsManager' });

  const secret = await smClient.getSecretValue({ SecretId: imageBuilderADCredentialsArn }).promise();

  const password = JSON.parse(secret.SecretString).password;

  /** @type {AWS.DirectoryService} */
  const dsClient = getClientSdk({ clientName: 'DirectoryService' });

  await dsClient
    .resetUserPassword({ DirectoryId: imageBuilderAdId, UserName: 'Admin', NewPassword: password })
    .promise();

  log('AD password reset complete.');
};

run();
