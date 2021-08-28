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
import _ from 'lodash';

/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
import { getSlsDeployPlugin, deployableUnitHelper } from '@aws-ee/base-script-utils';

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
    'solution-cicd-target-deploy': {
      usage: 'deploys the CICD stack',
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
    'solution-cicd-target-deploy:deploy': [
      async () => {
        const projectDir = path.normalize(path.join(__dirname, '../../'));
        const projectCustomSettings = await deployableUnitHelper.getCustomSettings(
          projectDir,
          slsPlugin,
          pluginRegistry,
        );

        const awsRoleRegex = [
          /^arn:(aws|aws-cn|aws-us-gov):iam::\d{12}:role\/\S+$/,
          /^arn:(aws|aws-cn|aws-us-gov):iam::\d{12}:root$/,
          /^\d{12}$/,
        ];
        if (!_.some(awsRoleRegex, regex => regex.test(projectCustomSettings.sourceAccountAppPipelineRole))) {
          slsPlugin.cli.error(
            "The 'sourceAccountAppPipelineRole' variable in not configured correctly in your cicd-target environment yaml.\n" +
              'Please read the CICD-README.md and update your environment configuration accordingly.\n',
          );
          return;
        }

        const slsDeployPlugin = getSlsDeployPlugin(path.normalize(path.join(__dirname, '../../')));
        await slsDeployPlugin.deploy(slsPlugin, pluginRegistry);
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
