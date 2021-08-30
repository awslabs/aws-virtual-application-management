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

import UserAuthzService from '../user-authz-service';

describe('UserAuthzService', () => {
  let userAuthzService = null;

  const notActiveAdmin = {
    principal: { isAdmin: true },
  };

  const activeAdmin = {
    principal: {
      status: 'active',
      isAdmin: true,
    },
  };

  const activeNotAdmin = {
    principal: { status: 'active' },
  };

  beforeEach(async () => {
    userAuthzService = new UserAuthzService();
  });

  describe('authorize - create', () => {
    it('should fail because incoming permission is deny', async () => {
      // BUILD
      const action = 'create';
      const effect = 'deny';

      // OPERATE
      const authorized = await userAuthzService.authorize(activeAdmin, { action, effect });

      // CHECK
      expect(authorized).toEqual({ effect: 'deny', action, resource: undefined, reason: undefined });
    });

    it('should fail because requestor is not active', async () => {
      // BUILD
      const action = 'create';
      const effect = 'allow';

      // OPERATE
      const authorized = await userAuthzService.authorize(notActiveAdmin, { action, effect });

      // CHECK
      expect(authorized).toMatchObject({ effect: 'deny' });
    });

    it('should fail because requestor is not admin', async () => {
      // BUILD
      const action = 'create';
      const effect = 'allow';

      // OPERATE
      const authorized = await userAuthzService.authorize(activeNotAdmin, { action, effect });

      // CHECK
      expect(authorized).toMatchObject({ effect: 'deny' });
    });

    it('should allow create', async () => {
      // BUILD
      const action = 'create';
      const effect = 'allow';

      // OPERATE
      const authorized = await userAuthzService.authorize(activeAdmin, { action, effect });

      // CHECK
      expect(authorized).toEqual({ effect: 'allow' });
    });
  });

  describe('authorize - createBulk', () => {
    it('should fail because incoming permission is deny', async () => {
      // BUILD
      const action = 'createBulk';
      const effect = 'deny';

      // OPERATE
      const authorized = await userAuthzService.authorize(activeAdmin, { action, effect });

      // CHECK
      expect(authorized).toEqual({ effect: 'deny', action, resource: undefined, reason: undefined });
    });

    it('should fail because requestor is not active', async () => {
      // BUILD
      const action = 'createBulk';
      const effect = 'allow';

      // OPERATE
      const authorized = await userAuthzService.authorize(notActiveAdmin, { action, effect });

      // CHECK
      expect(authorized).toMatchObject({ effect: 'deny' });
    });

    it('should fail because requestor is not admin', async () => {
      // BUILD
      const action = 'createBulk';
      const effect = 'allow';

      // OPERATE
      const authorized = await userAuthzService.authorize(activeNotAdmin, { action, effect });

      // CHECK
      expect(authorized).toMatchObject({ effect: 'deny' });
    });

    it('should allow createBulk', async () => {
      // BUILD
      const action = 'createBulk';
      const effect = 'allow';

      // OPERATE
      const authorized = await userAuthzService.authorize(activeAdmin, { action, effect });

      // CHECK
      expect(authorized).toEqual({ effect: 'allow' });
    });
  });

  describe('authorize - delete', () => {
    it('should fail because incoming permission is deny', async () => {
      // BUILD
      const action = 'delete';
      const effect = 'deny';
      const user = { userType: 'INTERNAL' };

      // OPERATE
      const authorized = await userAuthzService.authorize(activeAdmin, { action, effect }, user);

      // CHECK
      expect(authorized).toMatchObject({ effect: 'deny', action });
    });

    it('should fail because requestor is not active', async () => {
      // BUILD
      const action = 'delete';
      const effect = 'allow';
      const user = { userType: 'INTERNAL' };

      // OPERATE
      const authorized = await userAuthzService.authorize(notActiveAdmin, { action, effect }, user);

      // CHECK
      expect(authorized).toMatchObject({ effect: 'deny' });
    });

    it('should fail because requestor is not admin', async () => {
      // BUILD
      const action = 'delete';
      const effect = 'allow';
      const user = { userType: 'INTERNAL' };

      // OPERATE
      const authorized = await userAuthzService.authorize(activeNotAdmin, { action, effect }, user);

      // CHECK
      expect(authorized).toMatchObject({ effect: 'deny' });
    });

    it('should allow delete of user', async () => {
      // BUILD
      const action = 'delete';
      const effect = 'allow';
      const user = { userType: 'INTERNAL' };

      // OPERATE
      const authorized = await userAuthzService.authorize(activeAdmin, { action, effect }, user);

      // CHECK
      expect(authorized).toEqual({ effect: 'allow' });
    });
  });

  describe('authorize - update', () => {
    it('should fail because incoming permission is deny', async () => {
      // BUILD
      const action = 'update';
      const effect = 'deny';
      const user = { uuid: '123' };

      // OPERATE
      const authorized = await userAuthzService.authorize(activeAdmin, { action, effect }, user);

      // CHECK
      expect(authorized).toMatchObject({ effect: 'deny' });
    });

    it('should fail because requestor is not active', async () => {
      // BUILD
      const action = 'update';
      const effect = 'allow';
      const user = { uid: '123' };

      // OPERATE
      const authorized = await userAuthzService.authorize(notActiveAdmin, { action, effect }, user);

      // CHECK
      expect(authorized).toMatchObject({ effect: 'deny' });
    });

    it('should fail because requestor is not current user or admin', async () => {
      // BUILD
      const action = 'update';
      const effect = 'allow';
      const user = { uid: '123' };

      // OPERATE
      const authorized = await userAuthzService.authorize(activeNotAdmin, { action, effect }, user);

      // CHECK
      expect(authorized).toMatchObject({ effect: 'deny' });
    });

    it('should allow update because user is admin', async () => {
      // BUILD
      const action = 'update';
      const effect = 'allow';
      const user = { uid: '123' };

      // OPERATE
      const authorized = await userAuthzService.authorize(activeAdmin, { action, effect }, user);

      // CHECK
      expect(authorized).toEqual({ effect: 'allow' });
    });

    it('should allow update because user is current user', async () => {
      // BUILD
      const action = 'update';
      const effect = 'allow';
      const user = { uid: '123' };

      // OPERATE
      const authorized = await userAuthzService.authorize(
        { ...activeNotAdmin, principalIdentifier: { uid: '123' } },
        { action, effect },
        user,
      );

      // CHECK
      expect(authorized).toEqual({ effect: 'allow' });
    });
  });

  describe('authorize - updateAttributes', () => {
    it('should fail because incoming permission is deny', async () => {
      // BUILD
      const action = 'updateAttributes';
      const effect = 'deny';
      const user = {
        isAdmin: true,
        userType: 'INTERNAL',
        authenticationProviderId: '1234',
        identityProviderName: 'abcd',
        status: 'active',
      };
      const existingUser = {
        isAdmin: true,
        userType: 'INTERNAL',
        authenticationProviderId: '1234',
        identityProviderName: 'abcd',
        status: 'active',
      };

      // OPERATE
      const authorized = await userAuthzService.authorize(activeAdmin, { action, effect }, user, existingUser);

      // CHECK
      expect(authorized).toMatchObject({ effect: 'deny' });
    });

    it('should fail to update attributes because requestor is not admin', async () => {
      // BUILD
      const action = 'updateAttributes';
      const effect = 'allow';
      const user = {
        isAdmin: true,
        userType: 'INTERNAL',
        authenticationProviderId: '1234',
        identityProviderName: 'abcd',
        status: 'active',
      };
      const existingUser = {
        isAdmin: false,
        userType: 'INTERNAL',
        authenticationProviderId: '1234',
        identityProviderName: 'abcd',
        status: 'active',
      };

      // OPERATE
      const authorized = await userAuthzService.authorize(activeNotAdmin, { action, effect }, user, existingUser);

      // CHECK
      expect(authorized).toMatchObject({ effect: 'deny' });
    });

    it('should fail to update attributes because requestor is not active', async () => {
      // BUILD
      const action = 'updateAttributes';
      const effect = 'allow';
      const user = {
        isAdmin: true,
        userType: 'INTERNAL',
        authenticationProviderId: '1234',
        identityProviderName: 'abcd',
        status: 'active',
      };
      const existingUser = {
        isAdmin: false,
        userType: 'INTERNAL',
        authenticationProviderId: '1234',
        identityProviderName: 'abcd',
        status: 'active',
      };

      // OPERATE
      const authorized = await userAuthzService.authorize(notActiveAdmin, { action, effect }, user, existingUser);

      // CHECK
      expect(authorized).toMatchObject({ effect: 'deny' });
    });

    it('should update attributes requestor is admin and sets isAdmin on a user', async () => {
      // BUILD
      const action = 'updateAttributes';
      const effect = 'allow';
      const user = {
        isAdmin: true,
        userType: 'INTERNAL',
        authenticationProviderId: '1234',
        identityProviderName: 'abcd',
        status: 'active',
      };
      const existingUser = {
        isAdmin: false,
        userType: 'INTERNAL',
        authenticationProviderId: '1234',
        identityProviderName: 'abcd',
        status: 'active',
      };

      // OPERATE
      const authorized = await userAuthzService.authorize(activeAdmin, { action, effect }, user, existingUser);

      // CHECK
      expect(authorized).toEqual({ effect: 'allow' });
    });

    it('should update attributes because requestor is admin and sets a user to active', async () => {
      // BUILD
      const action = 'updateAttributes';
      const effect = 'allow';
      const user = {
        isAdmin: false,
        userType: 'INTERNAL',
        authenticationProviderId: '1234',
        identityProviderName: 'abcd',
        status: 'active',
      };
      const existingUser = {
        isAdmin: false,
        userType: 'INTERNAL',
        authenticationProviderId: '1234',
        identityProviderName: 'abcd',
        status: 'inactive',
      };

      // OPERATE
      const authorized = await userAuthzService.authorize(activeAdmin, { action, effect }, user, existingUser);

      // CHECK
      expect(authorized).toEqual({ effect: 'allow' });
    });
  });

  describe('authorizeUpdateAttributes', () => {
    const unprotAttr = {
      lastName: 'string',
    };
    const userRole = {
      userRole: 'admin',
    };
    const existingUser = {
      isExternalUser: false,
      userRole: 'researcher',
      authenticationProviderId: 'Queequeg',
      isAdmin: false,
      lastName: 'Kujira',
      userType: 'tree',
    };

    it('should only allow users to change unprotected attributes of themselves', async () => {
      // BUILD
      const isExternalUser = {
        isExternalUser: true,
      };
      const isAdmin = {
        isAdmin: true,
      };
      const identityProviderName = {
        identityProviderName: 'some-identity-provider-name',
      };
      const authenticationProviderId = {
        authenticationProviderId: '123456',
      };
      const isSamlAuthenticatedUser = {
        isSamlAuthenticatedUser: true,
      };

      // OPERATE
      const userUserUnprot = await userAuthzService.authorizeUpdateAttributes(
        activeNotAdmin,
        {},
        unprotAttr,
        existingUser,
      );
      const userUpdateRole = await userAuthzService.authorizeUpdateAttributes(
        activeNotAdmin,
        {},
        userRole,
        existingUser,
      );
      const userUpdateIsExternalUser = await userAuthzService.authorizeUpdateAttributes(
        activeNotAdmin,
        {},
        isExternalUser,
        existingUser,
      );
      const userUpdateIsAdmin = await userAuthzService.authorizeUpdateAttributes(
        activeNotAdmin,
        {},
        isAdmin,
        existingUser,
      );
      const userUpdateIdpName = await userAuthzService.authorizeUpdateAttributes(
        activeNotAdmin,
        {},
        identityProviderName,
        existingUser,
      );
      const userUpdateIdpId = await userAuthzService.authorizeUpdateAttributes(
        activeNotAdmin,
        {},
        authenticationProviderId,
        existingUser,
      );
      const userUpdateIsSamlAuthenticatedUser = await userAuthzService.authorizeUpdateAttributes(
        activeNotAdmin,
        {},
        isSamlAuthenticatedUser,
        existingUser,
      );
      const adminUpdateIsAdmin = await userAuthzService.authorizeUpdateAttributes(
        { principal: { isAdmin: true, status: 'active' } },
        {},
        isAdmin,
        existingUser,
      );

      // CHECK
      expect(userUserUnprot).toMatchObject({ effect: 'allow' });
      expect(userUpdateRole).toMatchObject({ effect: 'deny' });
      expect(userUpdateIsExternalUser).toMatchObject({ effect: 'deny' });
      expect(userUpdateIsAdmin).toMatchObject({ effect: 'deny' });
      expect(userUpdateIdpName).toMatchObject({ effect: 'deny' });
      expect(userUpdateIdpId).toMatchObject({ effect: 'deny' });
      expect(userUpdateIsSamlAuthenticatedUser).toMatchObject({ effect: 'deny' });
      expect(adminUpdateIsAdmin).toMatchObject({ effect: 'allow' });
    });

    it('should allow admins to change any attribute of other users', async () => {
      // BUILD
      const adminContext = {
        principal: {
          status: 'active',
          isAdmin: true,
          userType: 'admin',
        },
      };

      // OPERATE
      const adminUserUnprot = await userAuthzService.authorizeUpdateAttributes(
        adminContext,
        {},
        unprotAttr,
        existingUser,
      );
      const adminUserProt = await userAuthzService.authorizeUpdateAttributes(adminContext, {}, userRole, existingUser);

      // CHECK
      expect(adminUserUnprot).toMatchObject({ effect: 'allow' });
      expect(adminUserProt).toMatchObject({ effect: 'allow' });
    });
  });

  describe('unknown-action', () => {
    it('should fail because incoming permission is deny', async () => {
      // BUILD
      const action = 'unknown-action';
      const effect = 'deny';

      // OPERATE
      const authorized = await userAuthzService.authorize(activeAdmin, { action, effect });

      // CHECK
      expect(authorized).toEqual({ effect: 'deny', action, resource: undefined, reason: undefined });
    });

    it('should allow because incoming permission is allow', async () => {
      // BUILD
      const action = 'unknown-action';
      const effect = 'allow';

      // OPERATE
      const authorized = await userAuthzService.authorize(activeAdmin, { action, effect });

      // CHECK
      expect(authorized).toEqual({ effect: 'allow' });
    });
  });
});
