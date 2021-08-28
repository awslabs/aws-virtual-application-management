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

const _ = require('lodash');

class ParameterStore {
  constructor({ aws, sdk }) {
    this.aws = aws;
    this.sdk = sdk;
  }

  async getParameter(name) {
    const response = await this.sdk.getParameter({ Name: name, WithDecryption: true }).promise();
    return _.get(response, 'Parameter.Value');
  }

  async putParameter(name, value, overwrite = false) {
    const response = await this.sdk
      .putParameter({ Name: name, Value: value, Type: 'SecureString', Overwrite: overwrite })
      .promise();
    return { version: _.get(response, 'Version') };
  }
}

// The aws javascript sdk client name
ParameterStore.clientName = 'SSM';

// The framework is expecting this method. This is how the framework registers your aws services.
async function registerServices({ registry }) {
  registry.set('parameterStore', ParameterStore);
}

module.exports = { registerServices };
