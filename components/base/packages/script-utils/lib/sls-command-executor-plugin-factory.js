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
import { commandExecutorPluginFactory, pipedCommandExecutorPluginFactory } from './command-executor-plugin-factory';

/**
 * A global variable to hold flag if the SLS stats are disabled once.
 * See https://www.serverless.com/framework/docs/providers/aws/cli-reference/slstats/
 * for more info about sls stats
 *
 * @type {boolean}
 */
let slsStatsDisabled = false;
function markSlsStatsDisabled() {
  slsStatsDisabled = true;
}
function areSlsStatsDisabled() {
  return slsStatsDisabled;
}

/**
 * A factory that returns a plugin object containing a plugin method with the given "pluginMethodName".
 *
 * The returned plugin implementation just invokes the given "subcommand" as "pnpx sls <subcommand>", when the plugin is invoked.
 *
 * The plugin returned by this factory is expected to be invoked in the context of Serverless Framework Plugin during build time.
 *
 * With this method, the stdout and stderr of the subcommand child process are are shared with the parent process. If you
 * need to programatically intercept any of these, use {@link external:getPipedSlsCommandPlugin} instead.
 *
 * @param {string} slsProjDir Path to the Serverless Framework Project directory i.e., a directory containing "serverless.yml" file.
 * @param {string} pluginMethodName Plugin method name that should be implemented by the returned plugin.
 * @param {string} slsSubCommand The sls subcommand to be executed by the Serverless Framework CLI.
 * @param {string[]} additionalArgs Any additional command arguments to be passed to the sls command.
 * @param {boolean} shouldPrintCommand Whether to print information about the subprocess command before it is run. Defaults to true.
 *
 * @returns {{[pluginMethodName]: (function(*, *): Promise<*>)}} A plugin object containing the plugin method with the given pluginMethodName.
 */
function getSlsCommandPlugin({
  slsProjDir,
  pluginMethodName,
  slsSubCommand,
  additionalArgs = [],
  shouldPrintCommand = true,
}) {
  const commandExecutorPlugin = commandExecutorPluginFactory({
    pluginMethodName,
    command: 'pnpx',
    args: ['sls', slsSubCommand, ...additionalArgs],
    cwd: slsProjDir,
    shouldPrintCommand,
  });

  return assembleCommandPlugin(slsProjDir, pluginMethodName, commandExecutorPlugin, slsSubCommand);
}

/**
 * A factory that returns a plugin object containing a plugin method with the given "pluginMethodName".
 *
 * The returned plugin implementation just invokes the given "subcommand" as "pnpx sls <subcommand>", when the plugin is invoked.
 *
 * The plugin returned by this factory is expected to be invoked in the context of Serverless Framework Plugin during build time.
 *
 * With this method, the stdout and stderr of the subcommand process are written to the "warn" and "log"
 * methods of the plugin. You may also provide a {@link stdoutFn} and/or {@link stderrFn} for these
 * outputs to be written there as well. If you don't need to programatically intercept these outputs, use
 * {@link external:factory} instead.
 *
 * @param {string} slsProjDir Path to the Serverless Framework Project directory i.e., a directory containing "serverless.yml" file.
 * @param {string} pluginMethodName Plugin method name that should be implemented by the returned plugin.
 * @param {string} slsSubCommand The sls subcommand to be executed by the Serverless Framework CLI.
 * @param {string[]} additionalArgs Any additional command arguments to be passed to the sls command.
 * @param {boolean} shouldPrintCommand Whether to print information about the subprocess command before it is run. Defaults to true.
 * @param {function} stdoutFn If provided, then stdout will be written to this function, in addition to the default behavior of stdout being written to
 * the plugin's "warn" method. Expected format is (msg: string) => void.
 * @param {function} stderrFn If provided, then stderr will be written to this function, in addition to the default behavior of stderr being written to
 * the plugin's "warn" method. Expected format is (msg: string) => void.
 *
   @throws {Error} If subcommand child process could not be started.
   @throws {external:ChildProcessError} If subcommand child process errored.
 * @returns {{[pluginMethodName]: (function(*, *): Promise<*>)}} A plugin object containing the plugin method with the given pluginMethodName.
 */
function getPipedSlsCommandPlugin({
  slsProjDir,
  pluginMethodName,
  slsSubCommand,
  additionalArgs = [],
  shouldPrintCommand = true,
  stdoutFn,
  stderrFn,
}) {
  const commandExecutorPlugin = pipedCommandExecutorPluginFactory({
    pluginMethodName,
    command: 'pnpx',
    args: ['sls', slsSubCommand, ...additionalArgs],
    cwd: slsProjDir,
    shouldPrintCommand,
    stdoutFn,
    stderrFn,
  });

  return assembleCommandPlugin(slsProjDir, pluginMethodName, commandExecutorPlugin, slsSubCommand);
}

function assembleCommandPlugin(slsProjDir, pluginMethodName, commandExecutorPlugin, slsSubCommand) {
  let disableStatsPlugin;
  if (slsSubCommand !== 'slstats') {
    disableStatsPlugin = getSlsDisableStatsPlugin(slsProjDir);
  }

  const plugin = {
    // eslint-disable-next-line no-unused-vars
    [pluginMethodName]: async (slsPlugin, pluginRegistry) => {
      if (disableStatsPlugin && !areSlsStatsDisabled()) {
        // If SLS stats are not disabled then disable them
        // This needs to be done only once across all serverless projects for
        // the current CLI env so no need to run this before running every sls command
        await disableStatsPlugin.disableStats(slsPlugin, pluginRegistry);
      }
      const deployableUnitName = path.basename(slsProjDir);
      slsPlugin.cli.highlight(`\n\nSTART: [${deployableUnitName}] > ${slsSubCommand}\n\n`);
      const result = await commandExecutorPlugin[pluginMethodName](slsPlugin, pluginRegistry);
      slsPlugin.cli.highlight(`\n\nDONE: [${deployableUnitName}] > ${slsSubCommand}\n\n`);
      return result;
    },
  };
  return plugin;
}

function getSlsPackagePlugin(slsProjDir) {
  return getSlsCommandPlugin({ slsProjDir, pluginMethodName: 'prepareDeploy', slsSubCommand: 'package' });
}

function getSlsDeployPlugin(slsProjDir) {
  return getSlsCommandPlugin({
    slsProjDir,
    pluginMethodName: 'deploy',
    slsSubCommand: 'deploy',
    additionalArgs: ['-v'],
  });
}

function getSlsRemovePlugin(slsProjDir) {
  return getSlsCommandPlugin({ slsProjDir, pluginMethodName: 'remove', slsSubCommand: 'remove' });
}

function getSlsDisableStatsPlugin(slsProjDir) {
  const pluginMethodName = 'disableStats';
  const disableStatsPlugin = getSlsCommandPlugin({
    slsProjDir,
    pluginMethodName,
    slsSubCommand: 'slstats',
    additionalArgs: ['--disable'],
  });
  return {
    [pluginMethodName]: async (...args) => {
      markSlsStatsDisabled();
      return disableStatsPlugin[pluginMethodName](...args);
    },
  };
}

function getSlsPrintPlugin(slsProjDir, format = 'json', serverlessPath = '') {
  return getSlsCommandPlugin({
    slsProjDir,
    pluginMethodName: 'print',
    slsSubCommand: 'print',
    additionalArgs: ['--format', format, '--path', serverlessPath],
  });
}

export {
  getSlsCommandPlugin,
  getPipedSlsCommandPlugin,
  getSlsPackagePlugin,
  getSlsDeployPlugin,
  getSlsRemovePlugin,
  getSlsPrintPlugin,
  getSlsDisableStatsPlugin,
};
