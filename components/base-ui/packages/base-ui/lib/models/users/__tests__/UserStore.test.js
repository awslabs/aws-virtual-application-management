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

import { registerContextItems as registerUserStore } from '../UserStore';
import { getUser } from '../../../helpers/api';

jest.mock('../../../helpers/api');

describe('UserStore', () => {
  let store = null;
  const appContext = {
    userRolesStore: { ready: true, userRoles: { get: jest.fn().mockResolvedValue({ capabilities: [] }) } },
  };
  const username = 'username';
  const newUser = {
    username,
  };

  beforeEach(async () => {
    await registerUserStore(appContext);
    store = appContext.userStore;
    getUser.mockResolvedValueOnce(newUser);
    await store.load();
  });

  describe('store', () => {
    it('should contain a user', async () => {
      expect(store.empty).toBe(false);
      expect(store.user.longDisplayName).toBe(`${username}??`);
    });
    it('should remove user via cleanup', async () => {
      await store.cleanup();
      expect(store.empty).toBe(true);
    });
  });
});
