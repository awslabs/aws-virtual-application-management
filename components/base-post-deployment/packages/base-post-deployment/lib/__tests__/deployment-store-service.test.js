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
import { ServicesContainer } from '@aws-ee/base-services-container';
import { JsonSchemaValidationService, PluginRegistryService } from '@aws-ee/base-services';

import DeploymentStoreService from '../deployment-store-service';
import DbServiceMock from '../__mocks__/db-service.mock';
import SettingsServiceMock from '../__mocks__/settings-service.mock';

const settings = {
  dbDeploymentStore: 'dbMockDeploymentStore',
};

describe('DeploymentStoreService', () => {
  let sut;
  let logServiceMock;
  let dbServiceMock;

  const deploymentStoreItem = { type: 'mock-type', id: 'mock-id' };

  beforeEach(async () => {
    const container = new ServicesContainer();

    logServiceMock = {
      initService: jest.fn(),
      error: jest.fn(),
    };

    dbServiceMock = new DbServiceMock();

    container.register('log', logServiceMock);
    container.register('settings', new SettingsServiceMock(settings));
    container.register('pluginRegistryService', new PluginRegistryService({ getPlugins: () => [] }), { lazy: false });
    container.register('jsonSchemaValidationService', new JsonSchemaValidationService());
    container.register('dbService', dbServiceMock);

    container.register('sut', new DeploymentStoreService());

    await container.initServices();
    sut = await container.find('sut');
  });

  describe('createOrUpdate', () => {
    describe('successful calls', () => {
      it('correctly creates a new deployment store item', async () => {
        await sut.createOrUpdate(deploymentStoreItem);
        expect(dbServiceMock.getItem(settings.dbDeploymentStore, deploymentStoreItem)).toEqual(deploymentStoreItem);
      });

      it('correctly updates a new deployment store item', async () => {
        deploymentStoreItem.value = 'mock-value';
        await sut.createOrUpdate(deploymentStoreItem);
        expect(dbServiceMock.getItem(settings.dbDeploymentStore, _.omit(deploymentStoreItem, ['value']))).toEqual(
          deploymentStoreItem,
        );

        deploymentStoreItem.value = undefined;
      });
    });
  });

  describe('find', () => {
    describe('successful calls', () => {
      it('correctly returns deployment store item', async () => {
        dbServiceMock.putItem(settings.dbDeploymentStore, deploymentStoreItem, deploymentStoreItem);
        const result = await sut.find(deploymentStoreItem);
        expect(result).toEqual(deploymentStoreItem);
      });
    });
  });

  describe('mustFind', () => {
    describe('successful calls', () => {
      it('correctly returns deployment store item', async () => {
        dbServiceMock.putItem(settings.dbDeploymentStore, deploymentStoreItem, deploymentStoreItem);
        const result = await sut.mustFind(deploymentStoreItem);
        expect(result).toEqual(deploymentStoreItem);
      });

      it('throws when an item is not found', async () => {
        try {
          await sut.mustFind({ id: 'unknownId', type: 'unknownType' });
        } catch (e) {
          expect(e.status).toBe(404);
          expect(e.code).toBe('notFound');
          expect(e.message).toBe(`deployment item of type "unknownType" and id "unknownId" does not exist`);
        }
      });
    });
  });

  describe('delete', () => {
    describe('successful calls', () => {
      it('correctly deletes a deployment store item', async () => {
        dbServiceMock.putItem(settings.dbDeploymentStore, deploymentStoreItem, deploymentStoreItem);
        await sut.delete(deploymentStoreItem);
        expect(dbServiceMock.getItem(settings.dbDeploymentStore, deploymentStoreItem)).toEqual(undefined);
        expect(dbServiceMock.getDeletedItem(settings.dbDeploymentStore, deploymentStoreItem)).toEqual(
          deploymentStoreItem,
        );
      });
    });
  });
});
