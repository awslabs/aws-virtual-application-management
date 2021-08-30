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
import DbServiceMock from '../../db-service';
import AuthServiceMock from '../../authorization/authorization-service';
import UserAuthzServiceMock from '../user-authz-service';
import AuditServiceMock from '../../audit/audit-writer-service';
import SettingsServiceMock from '../../settings/env-settings-service';
import PluginRegistryServiceMock from '../../plugin-registry/plugin-registry-service';
import UserRolesService from '../user-roles-service';
import JsonSchemaValidationService from '../../json-schema-validation-service';

// Mocked dependencies

// we need the custom DbService Mock
jest.mock('../../db-service');

jest.mock('../../authorization/authorization-service');

jest.mock('../user-authz-service');

jest.mock('../../audit/audit-writer-service');

jest.mock('../../settings/env-settings-service');

jest.mock('../../plugin-registry/plugin-registry-service');

describe('UserRolesService', () => {
  let service = null;
  let dbService = null;
  let authorizationService = null;
  const error = { code: 'ConditionalCheckFailedException' };
  beforeEach(async () => {
    authorizationService = new AuthServiceMock();

    // Initialize services container and register dependencies
    const container = new ServicesContainer();
    // container.register('log', new Logger());
    container.register('pluginRegistryService', new PluginRegistryServiceMock());
    container.register('jsonSchemaValidationService', new JsonSchemaValidationService());
    container.register('dbService', new DbServiceMock());
    container.register('authorizationService', authorizationService);
    container.register('userAuthzService', new UserAuthzServiceMock());
    container.register('auditWriterService', new AuditServiceMock());
    container.register('settings', new SettingsServiceMock());
    container.register('userRolesService', new UserRolesService());

    await container.initServices();

    // Get instance of the service we are testing
    service = await container.find('userRolesService');
    dbService = await container.find('dbService');
  });

  describe('create', () => {
    it('should fail because the role lacks an id', async () => {
      // BUILD
      const newUserRole = {
        description: 'Custom User Role',
        userType: 'INTERNAL',
        capabilities: [],
      };

      // OPERATE
      try {
        await service.create({}, newUserRole);
        expect.hasAssertions();
      } catch (err) {
        // CHECK
        expect(err.message).toEqual('Input has validation errors');
      }
    });

    it('should fail because user role already exists', async () => {
      // BUILD
      const newUserRole = {
        id: 'customRole',
        description: 'Custom User Role',
        userType: 'INTERNAL',
        capabilities: [],
      };
      dbService.table.update.mockImplementationOnce(() => {
        throw error;
      });

      // OPERATE
      try {
        await service.create({}, newUserRole);
        expect.hasAssertions();
      } catch (err) {
        // CHECK
        expect(err.message).toEqual('user role with id "customRole" already exists');
      }
    });

    it('should try to create a user role', async () => {
      // BUILD
      const newUserRole = {
        id: 'customRole',
        description: 'Custom User Role',
        userType: 'INTERNAL',
        capabilities: [],
      };
      service.audit = jest.fn();

      // OPERATE
      await service.create({}, newUserRole);

      // CHECK
      expect(dbService.table.key).toHaveBeenCalledWith(
        expect.objectContaining({ entityType: 'role', id: 'customRole' }),
      );
      expect(service.audit).toHaveBeenCalledWith({}, expect.objectContaining({ action: 'create-user-role' }));
    });
  });

  describe('update', () => {
    const id = 'customRole';
    const userRole = {
      id,
      description: 'Custom User Role',
      userType: 'INTERNAL',
      capabilities: ['canDoSomething'],
      updatedBy: 'testuid',
    };
    it('should fail because no value of rev was provided', async () => {
      // BUILD
      const toUpdate = {
        description: 'test',
      };

      service.find = jest.fn().mockResolvedValue(userRole);

      // OPERATE
      try {
        await service.update({}, toUpdate);
        expect.hasAssertions();
      } catch (err) {
        // CHECK
        expect(err.message).toEqual('Input has validation errors');
      }
    });

    it('should fail because the user role was just updated', async () => {
      // BUILD
      const toUpdate = {
        id,
        description: 'test',
        rev: 2,
        userType: 'INTERNAL',
      };
      dbService.table.update.mockImplementationOnce(() => {
        throw error;
      });
      service.find = jest.fn().mockResolvedValue(userRole);

      // OPERATE
      try {
        await service.update({}, toUpdate);
        expect.hasAssertions();
      } catch (err) {
        // CHECK
        expect(err.message).toEqual(
          `user role information changed by "testuid" just before your request is processed, please try again`,
        );
      }
    });

    it('should successfully try to update the user role', async () => {
      // BUILD
      const toUpdate = {
        id,
        description: 'test',
        rev: 2,
        userType: 'INTERNAL',
      };

      service.audit = jest.fn();

      const nextCallIndex = authorizationService.assertAuthorized.mock.calls.length;

      // OPERATE
      await service.update({}, toUpdate);

      // CHECK
      expect(dbService.table.key).toHaveBeenCalledWith(expect.objectContaining({ id }));
      expect(service.audit).toHaveBeenCalledWith({}, expect.objectContaining({ action: 'update-user-role' }));
      expect(authorizationService.assertAuthorized.mock.calls[nextCallIndex][1].action).toBe('update');
    });
  });

  describe('delete', () => {
    const id = 'customRole';

    it('should fail because the user role does not exist', async () => {
      // BUILD
      dbService.table.delete.mockImplementationOnce(() => {
        throw error;
      });

      // OPERATE
      try {
        await service.delete({}, { id });
        expect.hasAssertions();
      } catch (err) {
        // CHECK
        expect(service.boom.is(err, 'notFound')).toBe(true);
      }
    });

    it('should successfully try to delete the user role', async () => {
      // BUILD
      service.audit = jest.fn();

      const nextCallIndex = authorizationService.assertAuthorized.mock.calls.length;

      // OPERATE
      await service.delete({}, { id });
      // CHECK
      expect(dbService.table.key).toHaveBeenCalledWith(expect.objectContaining({ id }));
      expect(service.audit).toHaveBeenCalledWith({}, expect.objectContaining({ action: 'delete-user-role' }));
      expect(authorizationService.assertAuthorized.mock.calls[nextCallIndex][1].action).toBe('delete');
    });
  });

  describe('list', () => {
    const userRoles = [
      {
        id: 'admin',
      },
      {
        id: 'guest',
      },
    ];

    it('should return all roles for admin users', async () => {
      // BUILD
      const requestContext = { principal: { userRole: 'admin', isAdmin: true } };
      dbService.table.queryPage.mockImplementationOnce(() => {
        return { items: userRoles };
      });

      // OPERATE
      const result = await service.list(requestContext);

      // CHECK
      expect(result.items).toEqual(userRoles);
    });

    it('should return only the current user role for non-admin users', async () => {
      // BUILD
      const requestContext = { principal: { userRole: 'guest', isAdmin: false } };
      service.find = jest.fn().mockResolvedValue(userRoles[1]);

      // OPERATE
      const result = await service.list(requestContext);

      // CHECK
      expect(result.items).toEqual([userRoles[1]]);
    });

    it('should throw not found for non-existing roles', async () => {
      // BUILD
      const requestContext = { principal: { userRole: 'missing', isAdmin: false } };
      service.mustFind = jest.fn().mockImplementationOnce((_requestContext, { id }) => {
        throw new Error(`user role with id "${id}" does not exist`);
      });

      // OPERATE
      try {
        await service.list(requestContext);
        expect.hasAssertions();
      } catch (err) {
        // CHECK
        expect(err.message).toEqual(`user role with id "${requestContext.principal.userRole}" does not exist`);
      }
    });
  });
});
