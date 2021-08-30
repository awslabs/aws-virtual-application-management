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

/**
 * Extracts the Cognito user pool ID from an authentication provider ID of the form
 *   https://cognito-idp.[REGION].amazonaws.com/[USER_POOL_ID]
 * @param {string} authProviderId - The authentication provider ID
 * @returns {string|undefined} - The user pool ID if the provider is a user pool; undefined otherwise
 */
function getUserPoolIdFromAuthProviderId(authProviderId) {
  const userPoolRegex = '^https://cognito-idp\\.[-a-z0-9]+\\.amazonaws\\.com/([-a-z0-9]+_[A-Za-z0-9]+)$';

  const userPoolMatches = authProviderId.match(userPoolRegex);
  return _.get(userPoolMatches, 1); // Index 1 should contain the chars in parentheses in the regex above
}

/**
 * Converts a user record into Cognito attributes that can be passed to Cognito's user management APIs
 * @param {Object} userRecord - The raw user record
 * @param {string} userRecord.email - The user's email
 * @param {string} userRecord.firstName - The user's first name
 * @param {string} userRecord.lastName - The user-s last name
 * @returns {Object[]} - The respective Cognito attributes
 */
function userRecordToCognitoAttrs(userRecord) {
  const attributeMap = [
    {
      Name: 'email',
      Value: userRecord.email,
    },
    {
      Name: 'given_name',
      Value: userRecord.firstName,
    },
    {
      Name: 'family_name',
      Value: userRecord.lastName,
    },
  ];

  // Only return defined attributes
  return _.filter(attributeMap, attribute => !_.isNil(attribute.Value));
}

export { getUserPoolIdFromAuthProviderId, userRecordToCognitoAttrs };
