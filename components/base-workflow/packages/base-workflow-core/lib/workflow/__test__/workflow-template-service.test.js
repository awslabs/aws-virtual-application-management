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

import WorkflowTemplateService from '../workflow-template-service';
import ServicesContainerMock from '../../__mocks__/services-container.mock';
import SettingsServiceMock from '../../__mocks__/settings-service.mock';
import DbServiceMock from '../../__mocks__/db-service';

const settings = {
  tableName: 'test-tableName',
};
describe('WorkflowTemplateService', () => {
  let service;
  let container;
  let jsonSchemaValidationService;
  let auditWriterService;
  let dbService;
  let stepTemplateService;
  beforeEach(async () => {
    service = new WorkflowTemplateService();
    dbService = new DbServiceMock();
    // Initialize services container and register dependencies
    jsonSchemaValidationService = {
      ensureValid: jest.fn().mockResolvedValue(true),
    };
    stepTemplateService = { mustFindVersion: jest.fn() };
    auditWriterService = { writeAndForget: jest.fn() };

    container = new ServicesContainerMock({
      service,
      jsonSchemaValidationService,
      settings: new SettingsServiceMock(settings),
      dbService,
      auditWriterService,
      stepTemplateService,
    });
    await container.initServices();
    service.audit = jest.fn();
  });

  describe('createVersion', () => {
    it('should create version and update of the latest record', async () => {
      // BUILD
      const requestContextMock = {
        principal: { isAdmin: true },
        principalIdentifier: { uid: 'test-uid' },
      };
      const manifest = {};
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
      service.applyDefaults = jest.fn(() => {
        return { id: 'test-manifest-id', v: 0 };
      });
      // OPERATE
      await service.createVersion(requestContextMock, manifest, {
        isLatest: true,
        tableName: 'test-table-name',
      });

      // CHECK
      expect(service.populateSteps).toHaveBeenCalled();
      expect(service.applyDefaults).toHaveBeenCalled();
      expect(service.audit).toHaveBeenCalledWith(
        requestContextMock,
        expect.objectContaining({
          action: 'create-workflow-template-version',
        }),
      );
    });
  });

  describe('updateVersion', () => {
    it('should update workflow template', async () => {
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
      service.applyDefaults = jest.fn(() => {
        return { id: 'test-manifest-id', v: 0, rev: 0 };
      });
      // OPERATE
      await service.updateVersion(requestContextMock, manifest, {
        isLatest: true,
        tableName: 'test-table-name',
      });

      // CHECK
      expect(service.populateSteps).toHaveBeenCalled();
      expect(service.applyDefaults).toHaveBeenCalled();
      expect(service.audit).toHaveBeenCalledWith(
        requestContextMock,
        expect.objectContaining({
          action: 'update-workflow-template-version',
        }),
      );
    });
  });

  describe('findVersion', () => {
    it('should find version of workflow version with id', async () => {
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
    it('must find version of workflow version with id', async () => {
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

  describe('populateSteps', () => {
    it('should populate workflow steps version', async () => {
      // BUILD
      const requestContextMock = {
        principal: { isAdmin: true },
        principalIdentifier: { uid: 'test-uid' },
      };
      const manifest = { selectedSteps: [{ stepTemplateVer: '0', stepTemplateId: 'test-stepTemplateId' }] };
      service.findVersion = jest.fn(() => {
        return { template: 'test-template' };
      });
      stepTemplateService.mustFindVersion = jest.fn();
      // OPERATE
      await service.populateSteps(manifest, requestContextMock);

      // CHECK
      expect(stepTemplateService.mustFindVersion).toHaveBeenCalledTimes(1);
      expect(stepTemplateService.mustFindVersion).toHaveBeenCalledWith(requestContextMock, {
        id: manifest.selectedSteps[0].stepTemplateId,
        v: manifest.selectedSteps[0].stepTemplateVer,
      });
    });
  });
});
