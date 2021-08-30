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

import slsInfoPlugin from './sls-info-plugin';
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
    'solution-relying-party-info': {
      usage: 'displays relying party information required for setting up trust on Identity Provider side',
      lifecycleEvents: ['info'],
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
    'solution-relying-party-info:info': [
      async () => {
        const info = await slsInfoPlugin.info(new Map(), slsPlugin, pluginRegistry);
        // Using plainPrint instead of prettyPrint because the Cognito User Pool Signing Cert is too big and messes
        // up the table formatting

        // The 'userPoolSigningCert' is not displayed during the regular "solution-info" command (due to it being really long and messing up the table formatting)
        // so its "display" flag is set to "false" by the "./sls-info-plugin.js"
        // We need to print it when explicitly running "solution-relying-party-info", so flip its "display" to "true"
        info.get('userPoolSigningCert').display = true;
        slsPlugin.plainPrint(info, 'Relying Party Information');
      },
    ],
  };
  return hooks;
}

const plugin = {
  getCommands,
  getHooks,
};

export default plugin;
