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

import aws from 'aws-sdk';

import { getCommandLogger } from '@aws-ee/base-serverless-solution-commands';

import LambdasOverrider from './lambdas-overrider';

export default class BackendTools {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.options = options;

    this.hooks = {
      'before:offline:start': this.resolveOverrides.bind(this),
      'before:invoke:local:loadEnvVars': this.resolveOverrides.bind(this),
    };

    this.cli = getCommandLogger(this.serverless, 'serverless-backend-tools');

    this.lambdasOverrider = new LambdasOverrider({ serverless, options });
  }

  async resolveOverrides() {
    const awsInstance = this.prepareAws();
    return this.lambdasOverrider.overrideEnvironments({ aws: awsInstance });
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
