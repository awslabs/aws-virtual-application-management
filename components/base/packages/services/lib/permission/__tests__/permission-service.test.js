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

import { ServicesContainer } from '@aws-ee/base-services-container';
import DbService from '../../__mocks__/db-service';
import PermissionService from '../permission-service';

function svc(mock) {
  return { ...mock, initService: jest.fn() };
}

describe('PermissionService', () => {
  let sut;
  let dbService;
  beforeEach(async () => {
    const container = new ServicesContainer();
    container.register(
      'jsonSchemaValidationService',
      svc({
        ensureValid: jest.fn(),
      }),
    );
    container.register(
      'authorizationService',
      svc({
        assertAuthorized: jest.fn(),
      }),
    );
    container.register(
      'auditWriterService',
      svc({
        writeAndForget: jest.fn(),
      }),
    );
    container.register('userService', svc({}));
    container.register(
      'pluginRegistryService',
      svc({
        visitPlugins: jest.fn((_ep, _method, { payload }) => Promise.resolve(payload)),
      }),
    );
    container.register('settings', svc({ get: () => 'mockTable' }));
    container.register('dbService', new DbService());
    container.register('sut', new PermissionService());
    await container.initServices();
    sut = await container.find('sut');
    dbService = await container.find('dbService');
  });

  describe('.find', () => {
    it('finds a permission in the table', async () => {
      const ctx = {};
      const dbResult = { action: 'testAction', principal: 'testPrincipal', resourceId: 'testResourceId' };
      dbService.table.get.mockResolvedValue(dbResult);

      const result = await sut.find(ctx, {
        principal: 'callPrincipal',
        resource: 'callResource',
        action: 'callAction',
        fields: ['fieldA', 'fieldB'],
      });

      expect(dbService.table.key).toHaveBeenCalledWith({
        actionResource: 'callActioncallResource',
        principal: 'callPrincipal',
      });
      expect(dbService.table.projection).toHaveBeenCalledWith(['fieldA', 'fieldB']);
      expect(result).toEqual({ action: 'testAction', principal: 'testPrincipal', resource: 'testResourceId' });
    });
  });

  describe('.verifyPrincipalPermission', () => {
    it('verifies a permission in the table', async () => {
      const ctx = {};
      const dbResult = { action: 'testAction', principal: 'testPrincipal', resourceId: 'testResourceId' };
      dbService.table.get.mockResolvedValue(dbResult);

      const result = await sut.verifyPrincipalPermission(ctx, {
        principal: 'callPrincipal',
        resource: 'callResource',
        action: 'callAction',
        fields: ['fieldA', 'fieldB'],
      });

      expect(dbService.table.key).toHaveBeenCalledWith({
        actionResource: 'callActioncallResource',
        principal: 'callPrincipal',
      });
      expect(dbService.table.projection).toHaveBeenCalledWith(['fieldA', 'fieldB']);
      expect(result).toEqual({ action: 'testAction', principal: 'testPrincipal', resource: 'testResourceId' });
    });
  });

  describe('.batchVerifyPrincipalsPermission', () => {
    it('verifies that the principals have the permission specified by the action', async () => {
      const principal1 = {};
      const resource1 = 'testResourceId';
      const resource2 = 'testResourceId2';
      const dbResult = [{ action: 'testAction', principal: 'testPrincipal', resourceId: resource1 }];
      dbService.table.get.mockResolvedValue(dbResult);
      const result = await sut.batchVerifyPrincipalsPermission(undefined, {
        principals: [principal1],
        resources: [resource1, resource2],
      });

      expect(result).toEqual([resource1]);
    });

    it('verifies that the principals have the permission specified by the action (multi principal)', async () => {
      const principal1 = {};
      const principal2 = {};
      const resource1 = 'testResourceId';
      const dbResult = [{ action: 'testAction', principal: 'testPrincipal', resourceId: resource1 }];
      dbService.table.get.mockResolvedValue(dbResult);
      const result = await sut.batchVerifyPrincipalsPermission(undefined, {
        principals: [principal1, principal2],
        resources: [resource1],
      });

      expect(result).toEqual([resource1]);
    });
  });

  describe('.create', () => {
    it('creates a permission', async () => {
      const ctx = {};
      const permission = {};
      const dbResult = { action: 'testAction', principal: 'testPrincipal', resourceId: 'resource1' };
      dbService.table.update.mockResolvedValue(dbResult);
      const result = await sut.create(ctx, permission);

      expect(result).toEqual({ action: 'testAction', principal: 'testPrincipal', resource: 'resource1' });
    });
  });
});
