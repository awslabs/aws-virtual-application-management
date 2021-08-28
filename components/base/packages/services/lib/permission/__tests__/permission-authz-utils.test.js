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

import { allow, deny } from '../../authorization/authorization-utils';
import { allowIfHasPermissionFactory } from '../permission-authz-utils';

const resource = { id: 'testResource' };
const permissionService = {
  batchVerifyPrincipalsPermission: jest.fn(),
};
const ctx = { principalIdentifier: { uid: 'testUser' } };

describe('permission-authz-utils', () => {
  describe('.allowIfHasPermissionFactory', () => {
    let sut;
    beforeEach(() => {
      sut = allowIfHasPermissionFactory({ permissionService });
    });

    it('allows when the correct resources are returned', async () => {
      permissionService.batchVerifyPrincipalsPermission.mockResolvedValue([resource]);

      const result = await sut(ctx, { action: 'testAction' }, resource);

      expect(result).toEqual(allow());
    });

    it('denies when no resources are returned', async () => {
      permissionService.batchVerifyPrincipalsPermission.mockResolvedValue([]);

      const result = await sut(ctx, { action: 'testAction' }, resource);

      expect(result).toEqual(deny(`Cannot perform the specified action "testAction".`));
    });
  });
});
