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

import _ from 'lodash/fp';
import * as fc from 'fast-check';
import { registerContextItems as registerUsersStore, toLongName, toLongNames, toUserIds } from '../UsersStore';
import { addUser, getUsers, updateUser } from '../../../helpers/api';

jest.mock('../../../helpers/api');

describe('UsersStore', () => {
  let store = null;
  const appContext = {};
  const uid = 'u-exampleUserId';
  const firstName = 'firstName';
  const firstNameUpdated = `${firstName}Updated`;
  const lastName = 'lastName';
  const username = 'example';
  const ns = 'ns';
  const email = 'email';
  const principal = { username, ns };
  const newUser = {
    uid,
    firstName,
    lastName,
    username,
    ns,
    email,
    isAdmin: true,
    authenticationProviderId: 'black_mesa', // Id of the authentication provider this user is authenticated against (such as internal, cognito auth provider id etc)
    identityProviderName: 'lambda_sector', // Name of the identity provider this user belongs to (such as Identity Provider Id in cognito user pool in case of Federation etc)
    status: 'active',
    rev: 0,
    userRole: 'admin',
    isExternalUser: false,
    userCapabilities: [],
    userType: 'INTERNAL',
  };

  const updatedUser = {
    uid,
    firstName: firstNameUpdated,
    lastName,
    username,
    ns,
    isAdmin: false,
  };

  const toObject = k => v => {
    return { [k]: v };
  };
  const toObjectLongDisplayName = toObject('longDisplayName');

  beforeEach(async () => {
    await registerUsersStore(appContext);
    store = appContext.usersStore;
  });

  describe('addUser', () => {
    it('should add a new user', async () => {
      // BUILD
      getUsers.mockResolvedValueOnce({ items: [] });
      addUser.mockResolvedValueOnce(newUser);
      await store.load();

      // CHECK
      expect(store.empty).toBe(true);

      // OPERATE
      await store.addUser(newUser);

      // CHECK
      const firstListUser = _.head(store.list);
      const longDisplayName = `${firstName} ${lastName} (${email})`;
      expect(firstListUser.longDisplayName).toBe(longDisplayName);
      expect(firstListUser.unknown).toBe(false);
      expect(firstListUser.isSystem).toBe(false);
      expect(newUser).toMatchObject(firstListUser);
      expect(store.empty).toBe(false);
      expect(_.head(store.asSelectOptions())).toMatchObject({
        value: uid,
        label: longDisplayName,
        clearableValue: true,
      });
      expect(_.head(store.asDropDownOptions())).toMatchObject({
        value: uid,
        key: uid,
        text: longDisplayName,
      });
      expect(store.asUserObject(newUser)).toMatchObject(firstListUser);
      expect(_.head(store.asUserObjects([newUser]))).toMatchObject(firstListUser);
      expect(store.asUserObjects().length).toBe(0);
    });

    it('should not add user because it already exists', async () => {
      // BUILD
      getUsers.mockResolvedValueOnce({ items: [newUser] });
      addUser.mockResolvedValueOnce(newUser);
      await store.load();

      // OPERATE
      await store.addUser(newUser);

      // CHECK
      expect(store.list.length).toBe(1);
    });
  });

  describe('updateUser', () => {
    it('should update the user info', async () => {
      // BUILD
      getUsers.mockResolvedValueOnce({ items: [newUser] });
      updateUser.mockResolvedValueOnce(updatedUser);
      await store.load();

      // OPERATE
      await store.updateUser(updatedUser);

      // CHECK
      const firstListUser = _.head(store.list);
      const displayName = `${firstNameUpdated} ${lastName}`;
      expect(firstListUser.displayName).toEqual(displayName);
      expect(firstListUser.principal).toEqual(principal);
      expect(firstListUser.principalStr).toEqual(JSON.stringify(principal));
      expect(firstListUser.isActive).toBe(true);
      expect(firstListUser.longDisplayName).toEqual(displayName);
      expect(firstListUser.isSame(uid)).toBe(true);
      expect(firstListUser.isSamePrincipal(principal)).toBe(true);
      expect(firstListUser).toMatchObject(updatedUser);
    });
  });

  describe('toUserIds', () => {
    const objectsWithoutId = fc.array(fc.object().filter(_.negate(_.has('id'))));
    const objectsWithId = fc.array(fc.record({ id: fc.object() }), { minLength: 1 });

    it('returns array of undefined given array of objects without ID', () => {
      fc.assert(fc.property(objectsWithoutId, a => expect(_.every(_.isUndefined)(toUserIds(a))).toBe(true)));
    });
    it('returns array of IDs given array of objects with ID', () => {
      fc.assert(fc.property(objectsWithId, a => expect(toUserIds(a)).toEqual(_.map(_.get('id'))(a))));
    });
  });

  describe('toLongNames', () => {
    const objectsWithoutLongName = fc.array(fc.object().filter(_.negate(_.has('longDisplayName'))));
    const objectsWithLongName = fc.array(fc.record({ longDisplayName: fc.object() }), { minLength: 1 });

    it('returns array of undefined given array of objects without long name', () => {
      fc.assert(fc.property(objectsWithoutLongName, a => expect(_.every(_.isUndefined)(toLongNames(a))).toBe(true)));
    });

    it('returns array of long names given array of objects with long name', () => {
      fc.assert(
        fc.property(objectsWithLongName, a => expect(toLongNames(a)).toEqual(_.map(_.get('longDisplayName'))(a))),
      );
    });
  });

  describe('toLongName', () => {
    it('maps parameter object to Unknown where this is undefined', () => {
      expect(toLongName(undefined)).toBe('Unknown');
    });
    it('maps parameter object to its long name property where this is undefined', () => {
      fc.assert(fc.property(fc.object(), a => expect(toLongName(a)).toBeUndefined()));
    });
    it('maps parameter object to its long name property where this is defined', () => {
      fc.assert(fc.property(fc.object(), a => expect(toLongName(toObjectLongDisplayName(a))).toEqual(a)));
    });
  });
});
