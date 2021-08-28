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

import WorkflowService from '../workflow-service';
import ServicesContainerMock from '../../__mocks__/services-container.mock';
import SettingsServiceMock from '../../__mocks__/settings-service.mock';
import DbServiceMock from '../../__mocks__/db-service';

const settings = {
  tableName: 'test-tableName',
};
describe('WorkflowService', () => {
  let service;
  let container;
  let jsonSchemaValidationService;
  let auditWriterService;
  let dbService;
  let workflowTemplateService;
  let stepTemplateService;
  beforeEach(async () => {
    service = new WorkflowService();
    dbService = new DbServiceMock();
    // Initialize services container and register dependencies
    jsonSchemaValidationService = {
      ensureValid: jest.fn().mockResolvedValue(true),
    };
    workflowTemplateService = { mustFindVersion: jest.fn() };
    stepTemplateService = { mustFindVersion: jest.fn() };
    auditWriterService = { writeAndForget: jest.fn() };

    container = new ServicesContainerMock({
      service,
      jsonSchemaValidationService,
      settings: new SettingsServiceMock(settings),
      dbService,
      auditWriterService,
      workflowTemplateService,
      stepTemplateService,
    });
    await container.initServices();
    service.audit = jest.fn();
    service.internals = {
      findSteps: jest.fn(),
      applyOverrideConstraints: jest.fn(),
    };
  });

  describe('createVersion', () => {
    it('should create version and update of the latest record', async () => {
      // BUILD
      const requestContextMock = {
        principalIdentifier: {
          uid: 'test-uid',
        },
        principal: { isAdmin: true },
      };

      service.prepareWorkflow = jest.fn(() => {
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

      // OPERATE
      await service.createVersion(
        requestContextMock,
        {},
        {
          isLatest: true,
          tableName: 'test-table-name',
        },
      );

      // CHECK
      expect(service.prepareWorkflow).toHaveBeenCalled();
      expect(service.audit).toHaveBeenCalledWith(
        requestContextMock,
        expect.objectContaining({ action: 'create-workflow-version' }),
      );
    });
  });

  describe('prepareWorkflow', () => {
    it('should prepare workflow', async () => {
      // BUILD
      const requestContext = { principalIdentifier: { uid: 'test-uid' }, principal: { isAdmin: true } };
      const workflow = {
        workflowTemplateId: 'test-workflowTemplateId',
        workflowTemplateVer: 1,
      };
      const workflowTemplateServiceVersionMock = {
        title: 'test-workflowtemplate-title',
        desc: 'test-desc',
        instanceTtl: 'test-instanceTtl',
        builtin: 'test-builtin',
        hidden: 'test-hidden',
        runSpec: 'test-runSpec',
      };
      workflowTemplateService.mustFindVersion = jest.fn(() => {
        return workflowTemplateServiceVersionMock;
      });

      // OPERATE
      const result = await service.prepareWorkflow(requestContext, workflow);
      // CHECK

      expect(workflowTemplateService.mustFindVersion).toHaveBeenCalledWith(requestContext, {
        id: workflow.workflowTemplateId,
        v: workflow.workflowTemplateVer,
      });
      expect(service.internals.findSteps).toHaveBeenCalledWith(
        requestContext,
        workflow,
        workflowTemplateServiceVersionMock,
      );
      expect(result).toEqual(
        expect.objectContaining({
          title: 'test-workflowtemplate-title',
          desc: 'test-desc',
          instanceTtl: 'test-instanceTtl',
          builtin: 'test-builtin',
          hidden: 'test-hidden',
          runSpec: 'test-runSpec',
          workflowTemplateId: 'test-workflowTemplateId',
          workflowTemplateVer: 1,
        }),
      );
    });
  });

  describe('updateVersion', () => {
    it('should update workflow version', async () => {
      // BUILD
      const requestContext = { principalIdentifier: { uid: 'test-uid' }, principal: { isAdmin: true } };
      const manifest = { rev: 1, id: 'test-manifest-id', v: 'test-v' };

      service.prepareWorkflow = jest.fn(() => {
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
      // OPERATE
      await service.updateVersion(requestContext, manifest, { isLatest: true, tableName: 'test-tableName' });

      // CHECK
      expect(service.prepareWorkflow).toHaveBeenCalled();
    });
  });
});
