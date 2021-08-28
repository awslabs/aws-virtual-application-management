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

/* eslint-disable no-console */
import chalk from 'chalk';
import { Table } from 'console-table-printer';
import inquirer from 'inquirer';
import _ from 'lodash';
import path from 'path';

import { PluginRegistryUtil } from '@aws-ee/base-script-utils';
import { getCommandsInfo } from '@aws-ee/main-commands';

import ServerlessSolutionCommands from './serverless-solution-commands';
import { getCommandLogger } from './command-logger';

const rootPath = path.join(__dirname, '../.babelrc');

/* Use on-the-fly babel compilation */
require('@babel/register')({
  extends: rootPath,
});

class ServerlessSolutionCommandsPlugin {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    // set the cwd to the directory from where the sls command was invoked
    this.cwd = path.normalize(path.resolve('.'));

    this.serverlessSolutionCommands = new ServerlessSolutionCommands(this);
    this.cli = getCommandLogger(this.serverless);

    // An object containing default solution level commands that this serverless plugin adds
    // other plugins registered via extension point "commands" can contribute their own commands
    const defaultCommandsMap = {
      // -- COMMANDS to assemble the solution by integrating components
      'solution-assemble': {
        usage:
          "First, uses the assembly process to create the solution's deployable units. Then installs all package dependencies in the workspace based on the package lock. Finally, builds all packages.",
        lifecycleEvents: ['assemble'],
        options: {
          'no-install': {
            usage: 'Skips installing dependencies after performing assembly tasks.',
            required: false,
          },
          'update-package-lock': {
            usage:
              'Unlike the default behavior without this flag, when installing dependencies the script will NOT fail if the lockfile is out of sync with the manifest, an update is needed, or not present. And it WILL generate a new lockfile if one does not exist, or update an existing lockfile if one already exists.',
            required: false,
          },
        },
      },

      // -- COMMANDS that run against pnpm workspace packages
      'solution-build': {
        usage: 'Builds all packages of the solution',
        lifecycleEvents: ['build'],
        options: {},
      },
      'solution-build-watch': {
        usage: 'Starts build watch across all packages of the solution',
        lifecycleEvents: ['buildWatch'],
        options: {},
      },
      'solution-unit-test': {
        usage: 'Runs unit tests for all packages of the solution',
        lifecycleEvents: ['unitTest'],
        options: {},
      },
      'solution-integration-test': {
        usage: 'Runs integration tests for all packages of the solution',
        lifecycleEvents: ['integrationTest'],
        options: {},
      },
      'solution-lint': {
        usage: 'Runs static code analysis i.e., lint npm script for all packages of the solution',
        lifecycleEvents: ['lint'],
        options: {},
      },

      // Commands that run against deployable units. Each deployable unit is a separate Serverless Framework Project.
      'solution-package': {
        usage: 'Packages all deployable units of the solution',
        lifecycleEvents: ['package'],
        options: {},
      },
      'solution-deploy': {
        usage: 'Deploys all deployable units of the solution',
        lifecycleEvents: ['deploy'],
        options: {
          cfnLintWarnOnly: {
            usage: 'When cfn-lint runs, do not break the deployment on errors',
            required: false,
          },
        },
      },
      'solution-info': {
        usage: 'Prints important information collected from all deployable units of the solution',
        lifecycleEvents: ['info'],
        options: {},
      },
      'solution-remove': {
        usage: 'Un-deploys all deployable units of the solution',
        lifecycleEvents: ['remove'],
        options: {},
      },
    };

    const commandsInfo = getCommandsInfo(this);
    const pluginRegistry = commandsInfo.getPluginRegistry();
    const pluginRegistryUtil = new PluginRegistryUtil(pluginRegistry);

    this.commands = pluginRegistryUtil.visitPlugins(
      'commands',
      'getCommands',
      { payload: defaultCommandsMap },
      this,
      pluginRegistry,
    );

    /**
     * An object containing default map of command lifecycle events and their hooks (handlers)
     * Serverless Plugin expects the "hooks" object to contain lifecycle events mapped to one and
     * only one hook function.
     * We want to give all plugins registered to the extension point "commands" give a chance to
     * provide their own hooks to each command lifecycle so we have each lifecycle event mapped
     * to an array of hook functions instead of just one function.
     */
    const defaultHooks = {
      'solution-assemble:assemble': [this.assemble.bind(this)],

      'solution-build:build': [this.build.bind(this)],
      'solution-build-watch:buildWatch': [this.buildWatch.bind(this)],
      'solution-unit-test:unitTest': [this.unitTest.bind(this)],
      'solution-integration-test:integrationTest': [this.integrationTest.bind(this)],
      'solution-lint:lint': [this.lint.bind(this)],

      'solution-package:package': [this.package.bind(this)],
      'solution-deploy:deploy': [this.deploy.bind(this)],
      'solution-info:info': [this.info.bind(this)],
      'solution-remove:remove': [this.remove.bind(this)],
    };
    const hooksFromAllPlugins = pluginRegistryUtil.visitPlugins(
      'commands',
      'getHooks',
      { payload: defaultHooks },
      this,
      pluginRegistry,
    );
    this.hooks = _.transform(
      hooksFromAllPlugins,
      (result, value, key) => {
        const hookFns = value;
        if (_.isArray(hookFns)) {
          // the hooks may be an array of hook functions but Serverless Framework expects
          // only one hook function so create a wrapper function that will call each hook
          // function in sequence and pass the Serverless Framework plugin instance
          // (i.e., "this") as an argument to the hook function
          result[key] = async () => {
            // call each hook function in strict order
            for (let i = 0; i < hookFns.length; i += 1) {
              const hookFn = hookFns[i];
              // We need to await the hook method call in strict sequence
              // so awaiting in loop
              // eslint-disable-next-line no-await-in-loop
              await hookFn(this);
            }
          };
        } else {
          // if the hook function (value) is not an array of functions then set it to the hook object (result) "as is"
          result[key] = value;
        }
        return result;
      },
      {},
    );
  }

  async assemble() {
    return this.serverlessSolutionCommands.assemble();
  }

  async build() {
    return this.serverlessSolutionCommands.build();
  }

  async buildWatch() {
    return this.serverlessSolutionCommands.buildWatch();
  }

  async unitTest() {
    return this.serverlessSolutionCommands.unitTest();
  }

  async integrationTest() {
    return this.serverlessSolutionCommands.integrationTest();
  }

  async lint() {
    return this.serverlessSolutionCommands.lint();
  }

  async package() {
    return this.serverlessSolutionCommands.package();
  }

  async deploy() {
    await this.serverlessSolutionCommands.deploy();

    this.cli.log(`\n\n----- ENVIRONMENT "${this.options.stage}" DEPLOYED SUCCESSFULLY 🎉 -----\n\n`);

    await this.info();
  }

  async info() {
    const info = await this.serverlessSolutionCommands.info();
    this.prettyPrint(info);
  }

  async remove() {
    const isInteractiveTerminal = process.stdout.isTTY;
    if (isInteractiveTerminal) {
      // if the command is called from an interactive environment then prompt the user for confirmation
      // for non-interactive envs (such as CI/CD pipelines) there will be no prompt
      const { confirmedStage } = await inquirer.prompt([
        {
          type: 'input',
          name: 'confirmedStage',
          message: chalk.yellowBright(
            '\n\n ************************ WARNING ********************** \n\n' +
              'Are you sure?\n' +
              'THIS WILL UN-DEPLOY ALL RESOURCES PROVISIONED BY THE SOLUTION AND LEAD TO DATA LOSS.\n' +
              `This operation cannot be undone. Are you sure, you want to proceed with removing the environment [${this.options.stage}]?\n` +
              `Type the environment name (stage name) to confirm the removal: [${this.options.stage}]`,
          ),
        },
      ]);

      if (confirmedStage !== this.options.stage) {
        this.cli.error('Confirmation mismatch. Exiting\n\n');
        return;
      }
    }

    this.cli.log(`\n\nStarting to un-deploy the application for stage [${this.options.stage}] ...\n\n`);
    await this.serverlessSolutionCommands.remove();
    this.cli.log(`\n\n----- ENVIRONMENT "${this.options.stage}" DELETED SUCCESSFULLY 🎉 -----\n\n`);
  }

  prettyPrint(infoMap, title = 'Summary') {
    this.cli.raw('\n\n');
    const table = new Table({
      title,
      columns: [
        { name: 'Name', alignment: 'left', color: 'cyan' },
        { name: 'Value', alignment: 'left' },
      ],
    });

    infoMap.forEach(infoVar => {
      if (infoVar.display) {
        table.addRow({ Name: infoVar.title, Value: infoVar.value }, { color: infoVar.color || 'yellow' });
      }
    });

    table.printTable();
  }

  plainPrint(infoMap, title = 'Summary') {
    this.cli.raw('\n\n');
    this.cli.raw(`${chalk.yellow(title)}:`);
    infoMap.forEach(infoVar => {
      if (infoVar.display) {
        this.cli.raw(`${chalk.cyan(infoVar.title)}: ${infoVar.value}`);
      }
    });
  }
}
export default ServerlessSolutionCommandsPlugin;
