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

import { registerContextItems as registerUserStore } from '../UserDisplayName';

jest.mock('../../../helpers/api');

describe('UserDisplayName', () => {
  let store = null;
  const displayName = 'displayName';
  const longDisplayName = 'longDisplayName';
  const user = {
    isSystem: false,
  };
  const usersStore = {
    asUserObject: () => user,
  };
  const appContext = {
    userStore: {
      user,
      displayName,
      longDisplayName,
    },
    usersStore,
  };
  const emptyAppContext = {
    userStore: {},
    usersStore,
  };
  const uidSystem = '_system_';

  beforeEach(async () => {
    await registerUserStore(appContext);
    store = appContext.userDisplayName;
  });

  describe('getDisplayName, getLongDisplayName', () => {
    it('should return display name for undefined uid', async () => {
      expect(store.getDisplayName({})).toBe(displayName);
      expect(store.getLongDisplayName()).toBe(longDisplayName);
    });
    it('should return System display name for system uid', async () => {
      expect(store.getDisplayName({ uid: uidSystem })).toBe('System');
      expect(store.getLongDisplayName(uidSystem)).toBe('System');
    });
    it('should recognize _system_ as system', async () => {
      expect(store.isSystem(uidSystem)).toBe(true);
    });
    it('should recognize a non-system user as non-system', async () => {
      expect(store.isSystem()).toBe(false);
    });
    it('should recognize a non-existent user as non-system', async () => {
      expect(store.isSystem('foo')).toBe(false);
    });
    it('should return Unknown display name for unknown uid', async () => {
      await registerUserStore(emptyAppContext);
      store = emptyAppContext.userDisplayName;
      expect(store.getDisplayName('foo')).toBe('Unknown');
      expect(store.getLongDisplayName()).toBe('Unknown');
    });
    it('should return unknown display name for unknown uid', async () => {
      await registerUserStore(emptyAppContext);
      store = emptyAppContext.userDisplayName;
      expect(store.getDisplayName({ uid: 'foo' })).toBe('unknown');
      expect(store.getLongDisplayName({ uid: 'foo' })).toBe('unknown');
    });
  });
});
