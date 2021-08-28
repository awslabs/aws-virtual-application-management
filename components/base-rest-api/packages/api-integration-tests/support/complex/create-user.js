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

const createdBy = '_api-integration-tests_';

/**
 * A function that performs the complex task of creating a user.
 */
async function createUser({ aws, user }) {
  // Create user in Cognito
  const userPoolId = aws.settings.get('userPoolId');
  const authenticationProviderId = aws.settings.get('authenticationProviderId');

  const cognitoUserPools = await aws.services.cognitoUserPools();
  const { userId, password } = await cognitoUserPools.createUser({ userPoolId, user });

  // Create user record in DynamoDB
  const userRecord = {
    ...user,
    authenticationProviderId,
    username: userId,
    status: 'active',
    isAdmin: _.get(user, 'userRole') === 'admin',
    ns: authenticationProviderId,
    rev: 0,
    createdBy,
  };

  const db = await aws.services.dynamoDb();
  await db.tables.users
    .updater()
    .key({ uid: userId })
    .item(userRecord)
    .update();

  return { password };
}

module.exports = { createUser };
