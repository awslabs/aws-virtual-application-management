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

import path from 'path';
import replace from 'replace-in-file';

/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
import { getSlsCommandPlugin } from '@aws-ee/base-script-utils';
import { ServerlessSolutionCommands } from '@aws-ee/base-serverless-solution-commands';
import { deployableUnitHelper } from '@aws-ee/base-script-utils';

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
    'solution-cicd-deploy': {
      usage: 'deploys the CICD pipeline and target stacks',
      lifecycleEvents: ['cicdDeploy'],
    },
  };
  return commands;
}

function updateEnvironmentConfig(file, parameterName, parameterValue) {
  const regex = new RegExp(`^${parameterName}:.*`, 'gm');
  const options = {
    files: file,
    from: regex,
    to: `${parameterName}: '${parameterValue}'`,
  };
  replace.sync(options);
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
    'solution-cicd-deploy:cicdDeploy': [
      async () => {
        // slsPlugin.cwd points to the directory from where the sls command was run i.e., the top level project home directory
        const slsDeployTargetPlugin = getSlsCommandPlugin({
          slsProjDir: slsPlugin.cwd,
          pluginMethodName: 'deploy',
          slsSubCommand: 'solution-cicd-target-deploy',
        });
        const slsDeployPipelinePlugin = getSlsCommandPlugin({
          slsProjDir: slsPlugin.cwd,
          pluginMethodName: 'deploy',
          slsSubCommand: 'solution-cicd-pipeline-deploy',
        });

        const serverlessSolutionCommands = new ServerlessSolutionCommands(slsPlugin);

        const cicdTargetSettingsFile = `${slsPlugin.cwd}/main/config/settings/cicd-target/${slsPlugin.options.stage}.yml`;
        const cicdPipelineSettingsFile = `${slsPlugin.cwd}/main/config/settings/cicd-pipeline/${slsPlugin.options.stage}.yml`;

        const cicdPipelineProjectDir = path.normalize(path.join(__dirname, '../../../cicd-pipeline'));
        const projectCustomSettings = await deployableUnitHelper.getCustomSettings(
          cicdPipelineProjectDir,
          slsPlugin,
          pluginRegistry,
        );

        updateEnvironmentConfig(
          cicdTargetSettingsFile,
          'sourceAccountAppPipelineRole',
          projectCustomSettings.awsAccountInfo.awsAccountId,
        );
        await slsDeployTargetPlugin.deploy(slsPlugin, pluginRegistry);

        const info1 = await serverlessSolutionCommands.info();
        const cicdAppDeployerRoleArn = info1.get('cicdAppDeployerRoleArn').value;
        updateEnvironmentConfig(cicdPipelineSettingsFile, 'targetAccountAppDeployerRoleArn', cicdAppDeployerRoleArn);
        await slsDeployPipelinePlugin.deploy(slsPlugin, pluginRegistry);

        const info2 = await serverlessSolutionCommands.info();
        const cicdAppPipelineRoleArn = info2.get('cicdAppPipelineRoleArn').value;
        updateEnvironmentConfig(cicdTargetSettingsFile, 'sourceAccountAppPipelineRole', cicdAppPipelineRoleArn);
        await slsDeployTargetPlugin.deploy(slsPlugin, pluginRegistry);

        slsPlugin.cli.log(
          '\n\n\n------------------------------------------------------------------------------------------' +
            '\n-----------               CI/CD PIPELINE DEPLOYED SUCCESSFULLY 🎉              -----------' +
            '\n-----------  https://console.aws.amazon.com/codesuite/codepipeline/pipelines/  -----------' +
            '\n------------------------------------------------------------------------------------------\n\n\n',
        );
      },
    ],
  };
  return hooks;
}

const plugin = {
  getCommands,
  getHooks,
};

module.exports = plugin;
