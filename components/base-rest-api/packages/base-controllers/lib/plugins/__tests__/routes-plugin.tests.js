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
import routesPlugin from '../routes-plugin';
import ensureActiveFn from '../../middlewares/ensure-active';
import ensureAdminFn from '../../middlewares/ensure-admin';
import authenticationProviderController from '../../authentication-provider-controller';
import userRolesController from '../../user-roles-controller';
import userCapabilitiesController from '../../user-capabilities-controller';
import usersController from '../../users-controller';
import userController from '../../user-controller';

describe('routesPlugin', () => {
  function expectedItemsOrder(items, orderedItems) {
    expect(_.intersection(items, orderedItems)).toEqual(orderedItems);
  }

  describe('.getRoutes', () => {
    it('adds expected routes', async done => {
      const existingRoutes = new Map([['existing-route', []]]);
      const result = await routesPlugin.getRoutes(existingRoutes, {}, {});
      expect([...result.keys()]).toEqual([
        'existing-route',
        '/api/authentication/public/provider/configs',
        '/api/authentication/provider',
        '/api/authentication/logout',
        '/api/user-roles',
        '/api/user-capabilities',
        '/api/users',
        '/api/user',
      ]);

      // Ensure the controllers are appropriately authorized by verifying the correct
      // authorization middleware is ahead of the controller.
      expectedItemsOrder(result.get('/api/authentication/provider'), [ensureAdminFn, authenticationProviderController]);
      expectedItemsOrder(result.get('/api/user-roles'), [ensureActiveFn, userRolesController]);
      expectedItemsOrder(result.get('/api/user-capabilities'), [ensureActiveFn, userCapabilitiesController]);
      expectedItemsOrder(result.get('/api/users'), [ensureActiveFn, usersController]);
      expectedItemsOrder(result.get('/api/user'), [ensureActiveFn, userController]);
      done();
    });
  });
});
