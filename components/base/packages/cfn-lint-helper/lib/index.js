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

import { getCommandLogger } from '@aws-ee/base-serverless-solution-commands';
import { runCommand } from '@aws-ee/base-script-utils';
import path from 'path';

export default class CfnLintTool {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;
    this.provider = this.serverless.getProvider('aws');

    this.hooks = {
      'before:deploy:deploy': this.invokeCfnLint.bind(this),
    };

    this.cli = getCommandLogger(this.serverless, 'cfn-lint-helper');
  }

  async invokeCfnLint() {
    const compiledTemplateName = this.provider.naming.getCompiledTemplateFileName();
    const packagePath = path.normalize(path.join(this.serverless.config.servicePath, '.serverless'));
    const region = this.serverless.service.custom.settings.awsRegion;

    // These codes will cause the deployment to break on error (see: https://github.com/aws-cloudformation/cfn-python-lint/blob/v0.49.0/README.md)
    let successCodes = [0, 4, 8, 12];

    if (this.options.cfnLintWarnOnly) {
      this.cli.log('[WARNING] CFN-LINT will not break the deployment on errors');
      successCodes = [0, 2, 4, 6, 8, 10, 12, 14];
    }

    await runCommand({
      command: 'cfn-lint',
      args: ['-r', region, '-f', 'pretty', '-t', compiledTemplateName],
      successCodes,
      cwd: packagePath,
      printCommandFn: msg => this.cli.log(msg),
    });
  }
}
