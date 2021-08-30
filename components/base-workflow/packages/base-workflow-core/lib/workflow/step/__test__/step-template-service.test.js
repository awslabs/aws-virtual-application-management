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

import StepTemplateService from '../step-template-service';
import ServicesContainerMock from '../../../__mocks__/services-container.mock';
import SettingsServiceMock from '../../../__mocks__/settings-service.mock';
import DbServiceMock from '../../../__mocks__/db-service';

const settings = {
  tableName: 'test-tableName',
};
describe('StepTemplateService', () => {
  let service;
  let container;
  let jsonSchemaValidationService;
  let inputManifestValidationService;
  let dbService;
  beforeEach(async () => {
    service = new StepTemplateService();
    dbService = new DbServiceMock();
    // Initialize services container and register dependencies
    jsonSchemaValidationService = {
      ensureValid: jest.fn().mockResolvedValue(true),
    };
    inputManifestValidationService = {
      getValidationErrors: jest.fn(() => {
        return { message: 'get validation error success' };
      }),
    };
    container = new ServicesContainerMock({
      service,
      jsonSchemaValidationService,
      settings: new SettingsServiceMock(settings),
      dbService,
      inputManifestValidationService,
    });
    await container.initServices();
  });

  describe('createVersion', () => {
    it('should create version of step template', async () => {
      // BUILD
      const requestContextMock = {
        principal: { isAdmin: true },
        principalIdentifier: { uid: 'test-uid' },
      };
      const manifest = {
        ver: 'test-ver',
        createdAt: '',
        updatedAt: '',
        updatedBy: '',
        rev: '',
        id: 'test-id',
        latest: 'latest-version',
      };
      service.populateSteps = jest.fn(() => {
        return {
          ver: 'test-ver',
          createdAt: '',
          updatedAt: '',
          updatedBy: '',
          rev: '',
          id: 'test-id',
          latest: 'latest-version',
        };
      });
      const defaultV = 0;
      service.applyDefaults = jest.fn(() => {
        return { id: 'test-manifest-id', v: defaultV };
      });
      // OPERATE
      const result = await service.createVersion(requestContextMock, manifest, {
        isLatest: true,
        tableName: 'test-table-name',
      });

      // CHECK
      expect(jsonSchemaValidationService.ensureValid).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({ id: manifest.id, rev: defaultV, v: manifest.latest }));
    });
  });

  describe('updateVersion', () => {
    it('should update step template', async () => {
      // BUILD
      const requestContextMock = {
        principal: { isAdmin: true },
        principalIdentifier: { uid: 'test-uid' },
      };
      const manifest = {
        rev: 1,
        id: 'test-id',
        v: 1,
        ver: 'test-ver',
        createdAt: '',
        updatedAt: '',
        updatedBy: '',
        latest: 'latest-version',
      };
      // OPERATE
      const result = await service.updateVersion(requestContextMock, manifest, {
        isLatest: true,
        tableName: 'test-table-name',
      });

      // CHECK
      expect(jsonSchemaValidationService.ensureValid).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({ id: manifest.id, v: manifest.latest }));
    });
  });

  describe('findVersion', () => {
    it('should find version of step version', async () => {
      // BUILD
      const requestContextMock = {
        principal: { isAdmin: true },
        principalIdentifier: { uid: 'test-uid' },
      };
      dbService.putItem(
        settings.tableName,
        { id: 'test-findVersion-id', ver: 'v0000_' },
        { id: 'test-findVersion-id', ver: 'v0000_', key: 'test-findVersion-key' },
      );

      // OPERATE
      const result = await service.findVersion(
        requestContextMock,
        { id: 'test-findVersion-id', v: 0, fields: [] },
        { tableName: settings.tableName },
      );

      // CHECK
      expect(result).toEqual({ id: 'test-findVersion-id', key: 'test-findVersion-key', v: 0 });
    });
  });
  describe('mustFindVersion', () => {
    it('must find version of step version with id', async () => {
      // BUILD
      const requestContextMock = {
        principal: { isAdmin: true },
        principalIdentifier: { uid: 'test-uid' },
      };
      service.findVersion = jest.fn(() => {
        return { template: 'test-template' };
      });
      // OPERATE
      await service.mustFindVersion(requestContextMock, { id: 'test-findVersion-id', v: 0, fields: [] });

      // CHECK
      expect(service.findVersion).toHaveBeenCalledTimes(1);
      expect(service.findVersion).toHaveBeenCalledWith(requestContextMock, {
        id: 'test-findVersion-id',
        v: 0,
        fields: [],
      });
    });
  });

  describe('mustValidateVersion', () => {
    it('must validate step version', async () => {
      // BUILD
      const requestContextMock = {
        principal: { isAdmin: true },
        principalIdentifier: { uid: 'test-uid' },
      };
      service.mustFindVersion = jest.fn(() => {
        return { inputManifest: 'test-inputManifest' };
      });
      // OPERATE
      const result = await service.mustValidateVersion(requestContextMock, { id: 'test-id', v: 0, fields: {} });

      // CHECK
      expect(service.mustFindVersion).toHaveBeenCalledTimes(1);
      expect(service.mustFindVersion).toHaveBeenCalledWith(requestContextMock, { id: 'test-id', v: 0 });
      expect(inputManifestValidationService.getValidationErrors).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ validationErrors: { message: 'get validation error success' } });
    });
  });
});
