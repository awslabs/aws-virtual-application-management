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
import aws from 'aws-sdk';

import { getCommandLogger } from '@aws-ee/base-serverless-solution-commands';

import { resolveDependentSettings } from './resolve-dependent-settings';

export default class OutputTools {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.hooks = {
      'before:deploy:deploy': this.outputInject.bind(this),
    };

    this.cli = getCommandLogger(this.serverless, 'serverless-cfn-output-helper');
  }

  async outputInject() {
    const awsInstance = this.prepareAws();
    const settings = this.serverless.service.custom.settings;
    const params = this.serverless.service.custom.outputInject || {};
    const outputs = this.serverless.service.provider.compiledCloudFormationTemplate.Outputs;
    _.assign(outputs, await resolveDependentSettings(awsInstance, params, settings, this.cli));
  }

  prepareAws() {
    const profile = this.serverless.service.custom.settings.awsProfile;
    const region = this.serverless.service.custom.settings.awsRegion;
    const credentials = new aws.SharedIniFileCredentials({ profile });

    // setup profile and region
    process.env.AWS_REGION = region;
    process.env.AWS_PROFILE = profile;

    aws.config.update({
      maxRetries: 3,
      region,
      sslEnabled: true,
      credentials,
    });

    return aws;
  }
}
