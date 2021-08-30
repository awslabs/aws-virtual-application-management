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
import { runCommand, runPipedCommand } from './run-command';

/**
 * A factory that returns a plugin object containing a plugin method with the given "pluginMethodName".
 * The returned plugin implementation invokes the given "command" when the plugin is invoked.
 *
 * The plugin returned by this factory is expected to be invoked in the context of Serverless Framework Plugin during build time.
 *
 * With this method, the stdout and stderr of the child process are are shared with the parent process. If you
 * need to programatically intercept any of these, use {@link external:factoryWithPipedCommand} instead.
 *
 * @param {string} pluginMethodName Plugin method name that should be implemented by the returned plugin.
 * @param {string} command A shell command to be executed upon plugin invocation.
 * @param {string[]} args List of string arguments.
 * @param {number[]} successCodes The command exit codes to be treated as success codes. Defaults to [0].
 * @param {string} cwd The working directory from where the shell command should be executed from.
 * @param {boolean} shouldPrintCommand Whether to print information about the subprocess command before it is run. Defaults to true.
 *
   @throws {Error} If child process could not be started.
   @throws {external:ChildProcessError} If child process errored (returns exit code not defined in {@link successCodes}.
 * @returns {{[pluginMethodName]: (function(*, *): Promise<*>)}} A plugin object containing the plugin method with the given pluginMethodName.
 */
const commandExecutorPluginFactory = ({
  pluginMethodName,
  command,
  args,
  successCodes = [0],
  cwd,
  shouldPrintCommand = true,
}) => {
  const plugin = {
    // eslint-disable-next-line no-unused-vars
    [pluginMethodName]: async (slsPlugin, _pluginRegistry) => {
      // Convert the "slsPlugin.options" object into command arguments
      // The "slsPlugin.options" has the shape { cliArgName: cliArgValue }
      const additionalArgNames = _.keys(_.omitBy(slsPlugin.options, _.isNil));
      const additionalArgs = _.map(additionalArgNames, argName => `--${argName}=${slsPlugin.options[argName]}`);
      const effectiveArgs = [...(args || []), ...(additionalArgs || [])];

      // We don't need access to the stdout stream of the child process, so we share the stdin,
      // stdout, and stderr of the parent process with the child process
      await runCommand({
        command,
        args: effectiveArgs,
        successCodes,
        cwd,
        ...(shouldPrintCommand && { printCommandFn: msg => slsPlugin.cli.log(msg) }),
      });
    },
  };
  return plugin;
};

/**
 * A factory that returns a plugin object containing a plugin method with the given "pluginMethodName".
 * The returned plugin implementation invokes the given "command" when the plugin is invoked.
 *
 * The plugin returned by this factory is expected to be invoked in the context of Serverless Framework Plugin during build time.
 *
 * With this method, the stdout and stderr of the child process are written to the "warn" and "log"
 * methods of the plugin. You may also provide a {@link stdoutFn} and/or {@link stderrFn} for these
 * outputs to be written there as well. If you don't need to programatically intercept these outputs, use
 * {@link external:factory} instead.
 *
 * @param {string} pluginMethodName Plugin method name that should be implemented by the returned plugin.
 * @param {string} command A shell command to be executed upon plugin invocation.
 * @param {string[]} args List of string arguments.
 * @param {number[]} successCodes The command exit codes to be treated as success codes. Defaults to [0].
 * @param {string} cwd The working directory from where the shell command should be executed from.
 * @param {boolean} shouldPrintCommand Whether to print information about the subprocess command before it is run. Defaults to true.
 * @param {function} stdoutFn If provided, then stdout will be written to this function, in addition to the default behavior of stdout being written to
 * the plugin's "warn" method. Expected format is (msg: string) => void.
 * @param {function} stderrFn If provided, then stderr will be written to this function, in addition to the default behavior of stderr being written to
 * the plugin's "warn" method. Expected format is (msg: string) => void.
 *
   @throws {Error} If child process could not be started.
   @throws {external:ChildProcessError} If child process errored (returns exit code not defined in {@link successCodes}.
 * @returns {{[pluginMethodName]: (function(*, *): Promise<*>)}} A plugin object containing the plugin method with the given pluginMethodName.
 */
const pipedCommandExecutorPluginFactory = ({
  pluginMethodName,
  command,
  args,
  successCodes = [0],
  cwd,
  shouldPrintCommand = true,
  stdoutFn,
  stderrFn,
}) => {
  const plugin = {
    // eslint-disable-next-line no-unused-vars
    [pluginMethodName]: async (slsPlugin, _pluginRegistry) => {
      // Convert the "slsPlugin.options" object into command arguments
      // The "slsPlugin.options" has the shape { cliArgName: cliArgValue }
      const additionalArgNames = _.keys(_.omitBy(slsPlugin.options, _.isNil));
      const additionalArgs = _.map(additionalArgNames, argName => `--${argName}=${slsPlugin.options[argName]}`);
      const effectiveArgs = [...(args || []), ...(additionalArgs || [])];

      await runPipedCommand({
        command,
        args: effectiveArgs,
        successCodes,
        cwd,
        ...(shouldPrintCommand && { printCommandFn: msg => slsPlugin.cli.log(msg) }),
        stdoutFn: msg => {
          slsPlugin.cli.log(msg);
          if (stdoutFn) {
            stdoutFn(msg);
          }
        },
        stderrFn: msg => {
          slsPlugin.cli.warn(msg);
          if (stderrFn) {
            stderrFn(msg);
          }
        },
      });
    },
  };
  return plugin;
};

export { commandExecutorPluginFactory, pipedCommandExecutorPluginFactory };
