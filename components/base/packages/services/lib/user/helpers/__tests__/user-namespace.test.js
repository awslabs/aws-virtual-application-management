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

import { itProp, fc } from 'jest-fast-check';
import { toUserNamespace, fromUserNamespace } from '../user-namespace';

describe('user-namespace', () => {
  describe('toUserNamespace', () => {
    itProp('returns name and id correctly joined', [fc.lorem(), fc.lorem()], (a, b) => {
      const prefix = b && `${b}||||`;
      expect(toUserNamespace(a, b)).toEqual(`${prefix}${a}`);
    });
  });

  describe('fromUserNamespace', () => {
    itProp(
      'is the inverse of toUserNamespace',
      [fc.lorem({ minLength: 1 }), fc.lorem({ minLength: 1 })],
      (authenticationProviderId, identityProviderName) => {
        expect(fromUserNamespace(toUserNamespace(authenticationProviderId, identityProviderName))).toEqual({
          authenticationProviderId,
          identityProviderName,
        });
      },
    );
  });
});
