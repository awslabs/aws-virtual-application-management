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
import path from 'path';

/* eslint-disable no-console */
import { PluginRegistryUtil, runPipedCommand, ChildProcessError } from '@aws-ee/base-script-utils';
import { getAssemblyInfo } from '@aws-ee/main-assembly';
import { getCommandsInfo } from '@aws-ee/main-commands';

class ServerlessSolutionCommands {
  constructor(slsPlugin) {
    this.slsPlugin = slsPlugin;
  }

  async runRecursivePnpmCommand(command, args = []) {
    await runPipedCommand({
      command: 'pnpm',
      args: ['run', command, '--recursive', '--if-present', ...args],
      stdoutFn: msg => this.slsPlugin.cli.log(msg),
      stderrFn: msg => this.slsPlugin.cli.warn(msg),
    });
  }

  async build() {
    await this.runRecursivePnpmCommand('build');
  }

  async buildWatch() {
    await this.runRecursivePnpmCommand('build:watch', ['--no-bail', '--parallel']);
  }

  async unitTest() {
    await this.runRecursivePnpmCommand('test');
  }

  async integrationTest() {
    const info = await this.info();

    const websiteUrlOutput = info.get('websiteUrl');
    const apiEndpointOutput = info.get('apiEndpoint');

    if (_.isNil(websiteUrlOutput) || _.isNil(apiEndpointOutput)) {
      this.slsPlugin.cli.error(
        "\n\nCan't find the target environment website URL or API endpoint.\nIs your target environment deployed?\n",
      );
      return;
    }

    await runPipedCommand({
      command: 'pnpm',
      args: ['run', 'intTest', '--recursive', '--if-present'],
      cwd: '.',
      env: {
        ENV_NAME: this.slsPlugin.options.stage,
        WEBSITE_URL: websiteUrlOutput.value,
        API_ENDPOINT: apiEndpointOutput.value,
      },
      stdoutFn: msg => this.slsPlugin.cli.log(msg),
      stderrFn: msg => this.slsPlugin.cli.warn(msg),
    });
  }

  async lint() {
    const assemblyInfo = getAssemblyInfo(this.slsPlugin);
    await this.runRecursivePnpmCommand('lint', [
      `--filter=!{${_.replace(
        path.normalize(assemblyInfo.targetSolutionDir),
        path.normalize(assemblyInfo.projectRootDir),
        '',
      )}}`,
      '--parallel',
    ]);
  }

  async install(shouldUpdatePackageLock = false) {
    const args = ['install', '--recursive'];
    if (!shouldUpdatePackageLock) {
      args.push('--frozen-lockfile');
    }

    await runPipedCommand({
      command: 'pnpm',
      args,
      cwd: '.',
      printCommandFn: msg => this.slsPlugin.cli.log(msg),
      stdoutFn: msg => this.slsPlugin.cli.log(msg),
      stderrFn: msg => this.slsPlugin.cli.warn(msg),
      stdoutErrPatterns: [/ERROR/],
    });
  }

  async assemble() {
    const assemblyInfo = getAssemblyInfo(this.slsPlugin);
    const pluginRegistry = assemblyInfo.getPluginRegistry();
    const pluginRegistryUtil = new PluginRegistryUtil(pluginRegistry);

    const assemblyTaskFns = await pluginRegistryUtil.visitPluginsAsync(
      'assemble',
      'getTasks',
      { payload: [] },
      assemblyInfo,
      this.slsPlugin,
      pluginRegistry,
    );

    // If this flag is specified, skip the installation task.
    // This is useful only when the solution is already assembled and you are making component assembly changes
    // that you need to test without installing (e.g. no new packages, no package.json changes).
    const shouldSkipInstall = this.slsPlugin.options.install === false;
    const shouldUpdatePackageLock = this.slsPlugin.options['update-package-lock'] === true;
    if (shouldSkipInstall && shouldUpdatePackageLock) {
      this.slsPlugin.cli.error(
        'The no installation flag and update package lock flags should not be simultaneously enabled',
      );
      return;
    }

    if (shouldSkipInstall) {
      this.slsPlugin.cli.warn('The no installation flag was specified. Installation of dependencies will be skipped');
    }

    if (shouldUpdatePackageLock) {
      this.slsPlugin.cli.warn(
        'The update package lock flag was specified. This means the "frozen lockfile" functionality of "pnpm install" will NOT be used while installing dependencies.',
      );
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const assemblyTaskFn of assemblyTaskFns) {
      // eslint-disable-next-line no-await-in-loop
      await assemblyTaskFn();
    }

    if (shouldSkipInstall) {
      return;
    }
    try {
      // Re-install all pnpm modules after assembly, since the assembly process may
      // may have contributed new packages to the pnpm workspace.
      await this.install(shouldUpdatePackageLock);
    } catch (err) {
      if (!(err instanceof ChildProcessError)) {
        // Unexpected error occurred, so re-throw
        throw err;
      }
      const errorMessageSubstringsToCatch = [
        // pnpm-lock.yaml missing
        'installation requires a pnpm-lock.yaml file',
        // pnpm-lock.yaml requires updating
        'pnpm-lock.yaml is not up-to-date with',
      ];
      /* eslint-disable no-restricted-syntax */
      for (const errorMessage of err.errorMessages) {
        for (const errorMessageSubstringToCatch of errorMessageSubstringsToCatch) {
          /* eslint-enable no-restricted-syntax */
          if (errorMessage.includes(errorMessageSubstringToCatch)) {
            this.slsPlugin.cli.error(
              'Could not install all packages in the pnpm workspace without modifying the current "pnpm-lock.yaml" file. This error usually occurs if you:' +
                '\n(a) Install or remove a component that contains one or more "package.json" files in the "assembly/assets/deployables/*" directories of its assembly package; or' +
                '\n(b) Manually add or remove packages (by directly editing "package.json" files, instead of using pnpm add/remove) inside a "package.json" file in the "assembly/assets/deployables/*" directories of a component\'s assembly package.' +
                '\n\nTo update the pnpm-lock.yaml and bypass this error, re-run this command with the "--update-package-lock" flag.',
            );
            return;
          }
        }
      }
      // Unexpected error occurred, so re-throw
      throw err;
    }
  }

  async package() {
    const commandsInfo = getCommandsInfo(this.slsPlugin);
    const pluginRegistry = commandsInfo.getPluginRegistry();

    const pluginRegistryUtil = new PluginRegistryUtil(pluginRegistry);
    await pluginRegistryUtil.runPlugins('package', 'prepareDeploy', this.slsPlugin, pluginRegistry);
  }

  async deploy() {
    const commandsInfo = getCommandsInfo(this.slsPlugin);
    const pluginRegistry = commandsInfo.getPluginRegistry();

    const pluginRegistryUtil = new PluginRegistryUtil(pluginRegistry);
    await pluginRegistryUtil.runPlugins('deploy', 'deploy', this.slsPlugin, pluginRegistry);
  }

  async info() {
    const commandsInfo = getCommandsInfo(this.slsPlugin);
    const pluginRegistry = commandsInfo.getPluginRegistry();

    const pluginRegistryUtil = new PluginRegistryUtil(pluginRegistry);
    return pluginRegistryUtil.visitPluginsAsync(
      'info',
      'info',
      { payload: new Map(), continueOnError: true },
      this.slsPlugin,
      pluginRegistry,
    );
  }

  async remove() {
    const commandsInfo = getCommandsInfo(this.slsPlugin);
    const pluginRegistry = commandsInfo.getPluginRegistry();

    const pluginRegistryUtil = new PluginRegistryUtil(pluginRegistry);
    await pluginRegistryUtil.runPlugins('remove', 'remove', this.slsPlugin, pluginRegistry);
  }
}

export default ServerlessSolutionCommands;
// Compatibility with SLS
module.exports = exports.default;
