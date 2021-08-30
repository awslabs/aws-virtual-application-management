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
import UserService from '../user-service';
import UserRolesService from '../user-roles-service';
import JsonSchemaValidationService from '../../json-schema-validation-service';

// Mocked dependencies
class MockCognitoIdentityServiceProvider {
  adminGetUser() {
    return {
      promise: jest.fn().mockResolvedValue,
    };
  }
}

// we need the custom DbService Mock
jest.mock('../../db-service');

jest.mock('../../authorization/authorization-service');

jest.mock('../user-authz-service');

jest.mock('../../audit/audit-writer-service');

jest.mock('../../settings/env-settings-service');

jest.mock('../../plugin-registry/plugin-registry-service');

describe('UserService', () => {
  let service = null;
  let dbService = null;
  let authorizationService = null;
  const error = { code: 'ConditionalCheckFailedException' };
  beforeEach(async () => {
    authorizationService = new AuthServiceMock();

    const mockAwsService = {
      initService: jest.fn().mockResolvedValue(),
      sdk: { CognitoIdentityServiceProvider: MockCognitoIdentityServiceProvider },
    };

    // Initialize services container and register dependencies
    const container = new ServicesContainer();
    container.register('aws', mockAwsService);
    // container.register('log', new Logger());
    container.register('pluginRegistryService', new PluginRegistryServiceMock());
    container.register('jsonSchemaValidationService', new JsonSchemaValidationService());
    container.register('dbService', new DbServiceMock());
    container.register('authorizationService', authorizationService);
    container.register('userAuthzService', new UserAuthzServiceMock());
    container.register('auditWriterService', new AuditServiceMock());
    container.register('settings', new SettingsServiceMock());
    container.register('userRolesService', new UserRolesService());
    container.register('userService', new UserService());

    await container.initServices();

    // Get instance of the service we are testing
    service = await container.find('userService');
    dbService = await container.find('dbService');
  });

  describe('createUser', () => {
    it('should fail because the user lacks a username', async () => {
      // BUILD
      const newUser = {
        email: 'example@example.com',
        firstName: 'Jaime',
        lastName: 'Lannister',
      };

      // OPERATE
      try {
        await service.createUser({}, newUser);
        expect.hasAssertions();
      } catch (err) {
        // CHECK
        expect(err.message).toEqual('Input has validation errors');
      }
    });

    it('should fail because user already exists', async () => {
      // BUILD
      const newUser = {
        username: 'jsnow',
        email: 'nightwatch@example.com',
        firstName: 'Jon',
        lastName: 'Snow',
        authenticationProviderId: 'WesterosAuthAuthority',
      };
      service.getUserByPrincipal = jest.fn().mockResolvedValue(newUser);
      dbService.table.get.mockReturnValueOnce(() => {
        // Mock call to get user role for 'guest'
        return { id: 'guest' };
      });

      // OPERATE
      try {
        await service.createUser({}, newUser);
        expect.hasAssertions();
      } catch (err) {
        // CHECK
        expect(err.message).toEqual('Cannot add user. The user already exists.');
      }
    });

    it('should try to create a user', async () => {
      // BUILD
      const newUser = {
        username: 'nstark',
        email: 'headlesshorseman@example.com',
        firstName: 'Ned',
        lastName: 'Stark',
        authenticationProviderId: 'WesterosAuthAuthority',
      };
      service.getUserByPrincipal = jest.fn();
      service.audit = jest.fn();
      dbService.table.get.mockReturnValueOnce(() => {
        // Mock call to get user role for 'guest'
        return { id: 'guest' };
      });

      // OPERATE
      await service.createUser({}, newUser);

      // CHECK
      expect(dbService.table.key).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: expect.any(String),
        }),
      );
      expect(service.audit).toHaveBeenCalledWith({}, expect.objectContaining({ action: 'create-user' }));
    });
  });

  describe('createUsers', () => {
    it('should fail because one of the users lacks a username', async () => {
      // BUILD
      const newUsers = [
        {
          email: 'example@example.com',
          firstName: 'Jaime',
          lastName: 'Lannister',
        },
        {
          email: 'example1@example.com',
          firstName: 'Thoros',
          lastName: 'Of Myr',
          username: 'thoros',
        },
      ];

      dbService.table.get.mockReturnValueOnce(() => {
        // Mock call to get user role for 'guest'
        return { id: 'guest' };
      });

      // OPERATE
      try {
        await service.createUsers({ principal: {} }, newUsers);
        expect.hasAssertions();
      } catch (err) {
        // CHECK
        expect(err.message).toEqual('Errors creating users in bulk');
        expect(err.payload).toContain(
          'Error creating user with email "example@example.com". Input has validation errors',
        );
      }
    });

    it('should fail because user already exists', async () => {
      // BUILD
      const newUser = {
        username: 'jsnow',
        email: 'nightwatch@example.com',
        firstName: 'Jon',
        lastName: 'Snow',
        authenticationProviderId: 'WesterosAuthAuthority',
      };

      const newUsers = [
        newUser,
        {
          username: 'tmyr',
          email: 'flamingsword@example.com',
          firstName: 'Thoros',
          lastName: 'Of Myr',
          authenticationProviderId: 'WesterosAuthAuthority',
        },
      ];

      service.getUserByPrincipal = jest.fn().mockResolvedValue(newUser);
      dbService.table.get
        .mockReturnValueOnce(() => {
          // Mock call to get user role for 'guest'
          return { id: 'guest' };
        })
        .mockReturnValueOnce(() => {
          // Mock call to get user role for 'guest'
          return { id: 'guest' };
        });

      // OPERATE
      try {
        await service.createUsers({ principal: {} }, newUsers);
        expect.hasAssertions();
      } catch (err) {
        // CHECK
        expect(err.message).toEqual('Errors creating users in bulk');
        expect(err.payload).toContain(
          'Error creating user with email "nightwatch@example.com". Cannot add user. The user already exists.',
        );
      }
    });

    it('should try to create new users', async () => {
      // BUILD
      const newUsers = [
        {
          username: 'nstark',
          email: 'headlesshorseman@example.com',
          firstName: 'Ned',
          lastName: 'Stark',
          userRole: 'admin',
          isExternalUser: false,
          authenticationProviderId: 'WesterosAuthAuthority',
        },
        {
          username: 'bdond',
          email: 'bericisback@example.com',
          firstName: 'Beric',
          lastName: 'Dondarrion',
          userRole: 'admin',
          isExternalUser: false,
          authenticationProviderId: 'WesterosAuthAuthority',
        },
      ];
      service.getUserByPrincipal = jest.fn();
      service.audit = jest.fn();
      // Unfortunately this doesn't have times()
      dbService.table.get
        .mockReturnValueOnce(() => {
          return { id: 'admin' };
        })
        .mockReturnValueOnce(() => {
          return { id: 'admin' };
        })
        .mockReturnValueOnce(() => {
          return { id: 'admin' };
        })
        .mockReturnValueOnce(() => {
          return { id: 'admin' };
        });

      // OPERATE
      const result = await service.createUsers({ principal: {} }, newUsers);

      // CHECK
      expect(dbService.table.key).toHaveBeenCalledWith(
        expect.objectContaining({
          uid: expect.any(String),
        }),
      );
      expect(service.audit).toHaveBeenCalledWith(
        { principal: {} },
        expect.objectContaining({ action: 'create-users-batch' }),
      );
      expect(result.successCount).toEqual(2);
      expect(result.errorCount).toEqual(0);
    });
  });

  describe('updateUser', () => {
    const uid = 'u-testUpdateUserId';
    const newUser = {
      uid,
      username: 'dtargaryen',
      email: 'dragonseverywhere@example.com',
      firstName: 'Daenerys',
      lastName: 'Targaryen',
      authenticationProviderId: 'https://cognito-idp.cool-dragon-app.amazonaws.com/us-east-1_AbCdE1234',
    };
    it('should fail because no value of rev was provided', async () => {
      // BUILD
      const toUpdate = {
        username: 'dtargaryen',
      };

      service.findUser = jest.fn().mockResolvedValue(newUser);

      // OPERATE
      try {
        await service.updateUser({}, toUpdate);
        expect.hasAssertions();
      } catch (err) {
        // CHECK
        expect(err.message).toEqual('Input has validation errors');
      }
    });

    it('should fail because the user does not exist', async () => {
      // BUILD
      const toUpdate = {
        uid,
        rev: 2,
      };

      service.findUser = jest.fn().mockResolvedValue();

      // OPERATE
      try {
        await service.updateUser({}, toUpdate);
        expect.hasAssertions();
      } catch (err) {
        // CHECK
        expect(err.message).toEqual(`Cannot update user "${uid}". The user does not exist`);
      }
    });

    it('should fail because the user was just updated', async () => {
      // BUILD
      const toUpdate = {
        uid,
        rev: 2,
      };

      dbService.table.update.mockImplementationOnce(() => {
        throw error;
      });
      service.findUser = jest.fn().mockResolvedValue(newUser);

      // OPERATE
      try {
        await service.updateUser({}, toUpdate);
        expect.hasAssertions();
      } catch (err) {
        // CHECK
        expect(service.boom.is(err, 'outdatedUpdateAttempt')).toBe(true);
      }
    });

    it('should successfully try to update the user', async () => {
      // BUILD
      const toUpdate = {
        uid,
        rev: 2,
      };

      service.findUser = jest.fn().mockResolvedValue(newUser);
      service.audit = jest.fn();

      const nextCallIndex = authorizationService.assertAuthorized.mock.calls.length;

      // OPERATE
      await service.updateUser({}, toUpdate);

      // CHECK
      expect(dbService.table.key).toHaveBeenCalledWith(expect.objectContaining({ uid }));
      expect(service.audit).toHaveBeenCalledWith({}, expect.objectContaining({ action: 'update-user' }));
      expect(authorizationService.assertAuthorized.mock.calls[nextCallIndex][1].action).toBe('update');
    });
  });

  describe('deleteUser', () => {
    const uid = 'u-testDeleteUserId';
    const curUser = {
      uid,
      username: 'astark',
      email: 'ilovemasks@example.com',
      firstName: 'Arya',
      lastName: 'Stark',
      authenticationProviderId: 'house_stark',
      identityProviderId: 'ned',
    };

    it('should fail because the user does not exist', async () => {
      // BUILD
      service.findUser = jest.fn().mockResolvedValue();

      // OPERATE
      try {
        await service.deleteUser({}, { uid: 'lskywalker' });
        expect.hasAssertions();
      } catch (err) {
        // CHECK
        expect(service.boom.is(err, 'notFound')).toBe(true);
      }
    });

    it('should fail because the user does not exist in the db', async () => {
      // BUILD
      service.findUser = jest.fn().mockResolvedValue(curUser);
      dbService.table.delete.mockImplementationOnce(() => {
        throw error;
      });

      // OPERATE
      try {
        await service.deleteUser({}, curUser);
        expect.hasAssertions();
      } catch (err) {
        // CHECK
        expect(err.message).toEqual(`The user "${uid}" does not exist`);
      }
    });

    it('should successfully try to delete the user', async () => {
      // BUILD
      service.findUser = jest.fn().mockResolvedValue(curUser);
      service.audit = jest.fn();

      const nextCallIndex = authorizationService.assertAuthorized.mock.calls.length;

      // OPERATE
      await service.deleteUser({}, curUser);
      // CHECK
      expect(dbService.table.key).toHaveBeenCalledWith('uid', uid);
      expect(service.audit).toHaveBeenCalledWith({}, expect.objectContaining({ action: 'delete-user' }));
      expect(authorizationService.assertAuthorized.mock.calls[nextCallIndex][1].action).toBe('delete');
    });
  });
});
