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

import { RequestContext } from '@aws-ee/base-services-container';
import { getSystemRequestContext } from '../system-context';

describe('getSystemRequestContext', () => {
  it('returns the expected context', () => {
    const result = getSystemRequestContext();
    expect(result).toBeInstanceOf(RequestContext);
    expect({ ...result }).toEqual({
      actions: [],
      attr: {},
      authenticated: true,
      principal: {
        isAdmin: true,
        ns: 'internal',
        status: 'active',
        uid: '_system_',
        userRole: 'admin',
        username: '_system_',
      },
      principalIdentifier: {
        uid: '_system_',
      },
      resources: [],
    });
  });
});
