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

import aws from 'aws-sdk';
import path from 'path';
import replace from 'replace-in-file';
import fs from 'fs';
import _ from 'lodash';

/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
import { getSlsDeployPlugin, deployableUnitHelper, runPipedCommand, awsHelper } from '@aws-ee/base-script-utils';

/**
 * Adds Serverless Framework (sls) commands.
 * This function is called by the "serverless-solution-commands" Serverless Framework Plugin (components/base/packages/serverless-solution-commands/index.js).
 * Plugins get a chance to add their own commands here.
 *
 * @param existingCommands A Plain JavaScript Object containing existing commands added by previous plugins (if any).
 *
 * @param pluginRegistry A registry that provides plugins registered by various components for the specified extension point.
 *
 * @returns Returns a Plain JavaScript Object containing additional Serverless Framework Commands.
 */
// eslint-disable-next-line no-unused-vars
function getCommands(existingCommands, pluginRegistry) {
  const commands = {
    ...existingCommands,
    'solution-cicd-pipeline-deploy': {
      usage: 'Deploys the CICD pipeline stack',
      lifecycleEvents: ['deploy'],
    },
  };
  return commands;
}

/**
 * Adds Serverless Framework (sls) hooks for the commands. You can add hook for any existing commands or custom commands you return in the `getCommands` method.
 * The hooks in Serverless Framework are actually an implementation for a specific lifecycle event of the command.
 *
 * This function is called by the "serverless-solution-commands" Serverless Framework Plugin (components/base/packages/serverless-solution-commands/index.js).
 * Plugins get a chance to add their own hook implementations here.
 *
 * @param existingHooks A Plain JavaScript Object containing any existing hooks added by previous plugins (if any). The object has the shape
 * { <hook-name>: <hook-function> }
 * @param slsPlugin Reference to the Serverless Framework Plugin object containing the "serverless" and "options" objects
 * @param pluginRegistry A registry that provides plugins registered by various components for the specified extension point.
 *
 * @returns Returns a Plain JavaScript Object containing additional Serverless Framework Hooks.
 */
function getHooks(existingHooks, slsPlugin, pluginRegistry) {
  const hooks = {
    ...existingHooks,
    'solution-cicd-pipeline-deploy:deploy': [
      async () => {
        const projectDir = path.normalize(path.join(__dirname, '../../'));
        const projectCustomSettings = await deployableUnitHelper.getCustomSettings(
          projectDir,
          slsPlugin,
          pluginRegistry,
        );

        const iamRoleRegex = /^arn:(aws|aws-cn|aws-us-gov):iam::\d{12}:role\/\S+$/;
        if (!iamRoleRegex.test(projectCustomSettings.targetAccountAppDeployerRoleArn)) {
          slsPlugin.cli.error(
            "The 'targetAccountAppDeployerRoleArn' variable in not configured correctly in your cicd-pipeline environment yaml.\n" +
              'Please read the CICD-README.md and update your environment configuration accordingly.\n',
          );
          return;
        }

        const slsDeployPlugin = getSlsDeployPlugin(projectDir);
        await slsDeployPlugin.deploy(slsPlugin, pluginRegistry);

        const environments = [projectCustomSettings.envName];
        if (projectCustomSettings.createStagingEnv) {
          environments.push(projectCustomSettings.stgEnvName);
        }

        const uploadConfigsIfNotVersioned = _.map(environments, async environment => {
          // slsPlugin.cwd points to the directory from where the sls command was run i.e., the top level project home directory
          const configFilePath = path.normalize(path.join(slsPlugin.cwd, `main/config/settings/${environment}.yml`));

          if (await isFileVersionControlled(configFilePath, projectDir)) {
            slsPlugin.cli.log(
              `Environment config is tracked in version control. It will NOT be uploaded to the artifact S3 bucket.`,
            );
            return;
          }

          slsPlugin.cli.log(`Environment ${environment} config is NOT tracked in version control.`);
          slsPlugin.cli.log(
            `Uploading "${configFilePath}" to the artifact S3 bucket "${projectCustomSettings.deploymentBucketName}".`,
          );

          await uploadConfig(configFilePath, projectCustomSettings, environment);
        });

        await Promise.all(uploadConfigsIfNotVersioned);
      },
    ],
  };
  return hooks;
}

async function uploadConfig(configFilePath, projectCustomSettings, environment) {
  const configParameterName = 'awsProfile';
  try {
    commentConfigParameter(configFilePath, configParameterName);

    const s3 = awsHelper.getClientSdk({
      clientName: 'S3',
      awsProfile: projectCustomSettings.awsProfile,
      awsRegion: projectCustomSettings.awsRegion,
    });

    await s3
      .upload({
        Bucket: projectCustomSettings.deploymentBucketName,
        Key: `settings/${environment}.yml`,
        Body: fs.readFileSync(configFilePath),
      })
      .promise();
  } finally {
    uncommentConfigParameter(configFilePath, configParameterName);
  }
}

async function isFileVersionControlled(filePath, projectDir) {
  let runCommandOutput = '';
  await runPipedCommand({
    command: 'git',
    args: ['ls-files', filePath],
    cwd: projectDir,
    stdoutFn: msg => {
      runCommandOutput = runCommandOutput.concat(msg.toString().replace(/\n/g, ''));
    },
  });

  return path.normalize(path.join(projectDir, runCommandOutput)) === filePath;
}

function commentConfigParameter(filePath, parameterName) {
  const regex = new RegExp(`^${parameterName}:`, 'gm');
  const options = {
    files: filePath,
    from: regex,
    to: `# ${parameterName}:`,
  };

  replace.sync(options);
}

function uncommentConfigParameter(filePath, parameterName) {
  const regex = new RegExp(`^# ${parameterName}:`, 'gm');
  const options = {
    files: filePath,
    from: regex,
    to: `${parameterName}:`,
  };

  replace.sync(options);
}

const plugin = {
  getCommands,
  getHooks,
};

module.exports = plugin;
