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

import chalk from 'chalk';

const defaultModule = 'serverless-solution-commands';
class CommandLogger {
  constructor(serverless, module) {
    this.serverless = serverless;
    this.module = module;
  }

  raw(message) {
    this.serverless.cli.consoleLog(chalk.dim(message));
  }

  log(message, prefix = 'INFO: ') {
    this.serverless.cli.consoleLog(`[${this.module}] ${prefix} ${chalk.yellow(message)}`);
  }

  highlight(message, prefix = 'NOTICE: ') {
    this.serverless.cli.consoleLog(`[${this.module}] ${prefix} ${chalk.greenBright(message)}`);
  }

  warn(message, prefix = 'WARNING: ') {
    this.serverless.cli.consoleLog(`[${this.module}] ${prefix} ${chalk.yellowBright(message)}`);
  }

  error(message, prefix = 'ERROR: ') {
    this.serverless.cli.consoleLog(`[${this.module}] ${prefix} ${chalk.red(message)}`);
  }
}

const getCommandLogger = (serverless, module = defaultModule) => {
  return new CommandLogger(serverless, module);
};

export { getCommandLogger };
export default CommandLogger;
