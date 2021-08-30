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

import { getUserPoolIdFromAuthProviderId, userRecordToCognitoAttrs } from '../utils';

describe('getUserPoolIdFromAuthProviderId', () => {
  it('returns undefined', () => {
    const nonCognitoProviderId = 'https://example.com/foo_bar123';
    const result = getUserPoolIdFromAuthProviderId(nonCognitoProviderId);
    expect(result).toBeUndefined();
  });

  it('extracts a user pool ID from an auth provider ID', () => {
    const userPoolId = 'us-east-1_XXXXXXXXX';
    const exampleCognitoProviderId = `https://cognito-idp.us-east-1.amazonaws.com/${userPoolId}`;
    const result = getUserPoolIdFromAuthProviderId(exampleCognitoProviderId);
    expect(result).toBe(userPoolId);
  });
});

describe('userRecordToCognitoAttrs', () => {
  it('maps a partial user record to Cognito attributes', () => {
    const userRecord = {
      email: 'zoidberg@planetexpress.org',
      lastName: 'zoidberg',
      userRole: 'doctor',
    };
    const expectedAttrs = [
      {
        Name: 'email',
        Value: 'zoidberg@planetexpress.org',
      },
      {
        Name: 'family_name',
        Value: 'zoidberg',
      },
    ];

    const result = userRecordToCognitoAttrs(userRecord);
    expect(result).toEqual(expectedAttrs);
  });

  it('returns an empty array', () => {
    const userRecord = { userRole: 'guest', status: 'inactive' };
    const result = userRecordToCognitoAttrs(userRecord);
    expect(result).toEqual([]);
  });
});
