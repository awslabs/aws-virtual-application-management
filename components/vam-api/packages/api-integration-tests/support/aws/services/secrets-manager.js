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

/* eslint-disable no-await-in-loop */
// @ts-check

const {
  utils: { run },
} = require('@aws-ee/api-testing-framework');

class SecretsManager {
  constructor({ aws, sdk }) {
    this.aws = aws;
    this.sdk = sdk;
  }

  async listSecrets() {
    const results = [];
    const params = {};

    do {
      const response = await run(async () => this.sdk.listSecrets(params).promise());
      if (response) {
        results.push(...response);
      }
      params.NextToken = response.NextToken;
    } while (params.NextToken);

    return results;
  }

  async getSecretValue(secretID) {
    const params = {
      SecretId: secretID,
    };

    const response = await run(async () => this.sdk.getSecretValue(params).promise());
    return JSON.parse(response.SecretString);
  }
}

SecretsManager.clientName = 'SecretsManager';

async function registerServices({ registry }) {
  registry.set('secretsManager', SecretsManager);
}

module.exports = { registerServices };
