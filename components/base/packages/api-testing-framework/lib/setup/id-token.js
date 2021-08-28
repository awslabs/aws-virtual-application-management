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

const assert = require('assert');

async function getIdToken({ aws, username, password }) {
  assert(username, 'username is required');
  assert(password, 'password is required');

  const userPoolId = aws.settings.get('userPoolId');
  const appClientId = aws.settings.get('appClientId');

  const cognitoUserPools = await aws.services.cognitoUserPools();
  if (_.isEmpty(cognitoUserPools)) {
    throw new Error('No "cognitoUserPools" AWS service class registered. Cannot authenticate test user.');
  }

  return cognitoUserPools.authenticate({ userPoolId, appClientId, username, password });
}

module.exports = {
  getIdToken,
};
