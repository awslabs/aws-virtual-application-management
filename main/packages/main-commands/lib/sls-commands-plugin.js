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

/**
 * Adds Serverless Framework (sls) commands.
 * This function is called by the "serverless-solution-commands" Serverless Framework Plugin (components/base/packages/serverless-solution-commands/index.js).
 * Plugins get a chance to add their own commands here.
 *
 * @param existingCommands A Plain JavaScript Object containing existing commands added by previous plugins (if any).
 * @param slsPlugin Reference to the Serverless Framework Plugin object containing the "serverless" and "options" objects
 * @param pluginRegistry A registry that provides plugins registered by various components for the specified extension point.
 *
 * @returns Returns a Plain JavaScript Object containing additional Serverless Framework Commands.
 */
// eslint-disable-next-line no-unused-vars
function getCommands(existingCommands, slsPlugin, pluginRegistry) {
  const commands = {
    ...existingCommands,
    // Add any additional commands you want to contribute to serverless here
    // each command you add here can be executed as "pnpx sls <your-command>"
    // The structure of the command object to add is same as what you would add
    // when creating custom Serverless Framework Plugins
    // For example, if you want to add a command named "welcome" so that it can be invoked as "pnpx sls welcome" you can do so as follows
    // welcome: {
    //   usage: 'Prints a welcome message',
    // }

    // See https://www.serverless.com/framework/docs/providers/aws/guide/plugins#command
    // for more information about commands
    // See https://www.serverless.com/blog/writing-serverless-plugins for additional information about custom Serverless Framework Plugin Development
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
// eslint-disable-next-line no-unused-vars
function getHooks(existingHooks, slsPlugin, pluginRegistry) {
  const hooks = {
    ...existingHooks,
    // Add any additional command hooks you want to contribute to Serverless here
    // each hook is attached to specific lifecycle event of a command
    // The hook is just a function that gets executed during the lifecycle of a command
    // The hooks here are same as what you would add when creating custom Serverless Framework Plugins
    //
    // The main DIFFERENCE is that your hook function will be passed an additional
    // "slsPlugin" argument that points to the the Serverless Framework Plugin instance and has the
    // usual plugin attributes and methods such as:
    // - slsPlugin.serverless: Reference to the "serverless" object
    // - slsPlugin.options: Reference to the serverless "options" object that contains the CLI options passed when
    //                      executing the sls command including the "stage" variable
    //
    // For example, you can pass a hook function here to perform some action when
    // "solution-build" command's "build" lifecycle event is triggered
    // i.e., when "pnpx sls solution-build" or "sls solution-build" command is executed, as follows
    //
    // Appending your hook function:
    // ------------------------------
    // // 1. Add the following at the top of this function
    // const buildHooks = existingHooks["solution-build:build"];
    // buildHooks.push(
    //   async slsPlugin => {
    //     slsPlugin.cli.log("--------------------------------");
    //     slsPlugin.cli.log("My hook function logic");
    //     slsPlugin.cli.log("--------------------------------");
    //   }
    // )
    //
    // // 2. Add the following here
    // "solution-build:build": buildHooks
    //
    // Replacing existing hook functions with just your own hook function:
    // ------------------------------------------------------------------
    // The above will execute your hook function after executing any existing hook functions registered by other
    // plugins. If you want to only execute your function (i.e., overwrite all other hook functions added by other
    // plugins) then you can do so as follows
    //
    // "solution-build:build": [
    //   async slsPlugin => {
    //     slsPlugin.cli.log("--------------------------------");
    //     slsPlugin.cli.log("My hook function logic");
    //     slsPlugin.cli.log("--------------------------------");
    //   }
    // ]

    // See https://www.serverless.com/framework/docs/providers/aws/guide/plugins#hooks
    // for more information about hooks
  };
  return hooks;
}

const plugin = {
  getCommands,
  getHooks,
};

export default plugin;
