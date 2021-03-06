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
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */
const _ = require('lodash');
const {
  utils: { run },
} = require('@aws-ee/api-testing-framework');

/**
 * A function that performs the complex task of deleting a user.
 *
 * @param {string} id The user id (a.k.a uid) to be deleted
 */
async function deleteUser({ aws, id = '' }) {
  // The clean up logic is as follows:
  // - As a measure of caution, we only delete the user if its id contains the runId, this helps us
  //   avoid deleting anything by accident.
  // - We delete the password entry for this user in the password table (if an entry exists)
  // - We delete all api key entries for this user if any exists
  // - We delete the user entry for the study permission table (if any exists)
  //   Note: we need to revisit this logic once the BYOB branch is merged
  // - We delete the user entry from the users table

  const runId = aws.settings.get('runId');
  const db = await aws.services.dynamoDb();
  const user = await db.tables.users
    .getter()
    .key({ uid: id })
    .get();

  if (_.isEmpty(user)) {
    console.log(`User with id "${id}" does not exist, skipping the deletion of this user`);
    return;
  }

  const username = user.username || '';

  if (!username.includes(`-${runId}-`)) {
    console.log(
      `User username "${username}" does not contain the runId "${runId}", skipping the deletion of this user as a measure of caution`,
    );

    return;
  }

  // Delete the user from Cognito and the Users table
  const userPoolId = aws.settings.get('userPoolId');
  const cognitoUserPools = await aws.services.cognitoUserPools();

  await run(() =>
    Promise.all([
      cognitoUserPools.deleteUser({ userPoolId, username }),
      db.tables.users
        .deleter()
        .key({ uid: id })
        .delete(),
    ]),
  );
}

module.exports = { deleteUser };
