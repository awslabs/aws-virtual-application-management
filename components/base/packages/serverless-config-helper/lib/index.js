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
import _ from 'lodash';

import { evalCondition } from './condition';

export default class ConfigurationTools {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.hooks = {
      'package:setupProviderConfiguration': this.conditionalMerge.bind(this),
    };

    this.cli = {
      raw(message) {
        serverless.cli.consoleLog(chalk.dim(message));
      },
      log(prefix = '', message) {
        serverless.cli.consoleLog(`${prefix} ${chalk.yellow(message)}`);
      },
      warn(prefix = '', message) {
        serverless.cli.consoleLog(`${prefix} ${chalk.yellowBright(message)}`);
      },
      error(prefix = '', message) {
        serverless.cli.consoleLog(`${prefix} ${chalk.redBright(message)}`);
      },
    };
  }

  async conditionalMerge() {
    const fragments = this.serverless.service.custom.fragments || [];
    fragments.forEach(({ fragment, condition, description }) => {
      const descriptionLog = description ? ` for '${description}'` : '';
      let resultLog = 'skipped';
      if (evalCondition(condition)) {
        _.merge(this.serverless.service, fragment);
        resultLog = 'applied';
      }
      this.cli.log('[serverless-config-helper]', `fragment${descriptionLog} (if ${condition}): ${resultLog}`);
    });
  }
}
