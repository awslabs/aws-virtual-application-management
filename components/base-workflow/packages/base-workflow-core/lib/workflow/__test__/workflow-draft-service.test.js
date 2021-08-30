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

import WorkflowDraftService from '../workflow-draft-service';
import ServicesContainerMock from '../../__mocks__/services-container.mock';
import SettingsServiceMock from '../../__mocks__/settings-service.mock';
import DbServiceMock from '../../__mocks__/db-service';

const settings = {
  tableName: 'test-tableName',
};

describe('WorkflowDraftService', () => {
  let service;
  let container;
  let jsonSchemaValidationService;
  let workflowTemplateService;
  let workflowService;
  let auditWriterService;
  beforeEach(async () => {
    service = new WorkflowDraftService();
    // Initialize services container and register dependencies
    jsonSchemaValidationService = {
      ensureValid: jest.fn().mockResolvedValue(true),
    };
    workflowTemplateService = {
      mustFindVersion: jest.fn(),
    };
    workflowService = {
      findVersion: jest.fn(),
      prepareWorkflow: jest.fn(),
      createVersion: jest.fn(),
    };
    auditWriterService = { writeAndForget: jest.fn() };

    container = new ServicesContainerMock({
      service,
      jsonSchemaValidationService,
      workflowTemplateService,
      workflowService,
      settings: new SettingsServiceMock(settings),
      dbService: new DbServiceMock(),
      auditWriterService,
    });
    workflowTemplateService = container.find('workflowTemplateService');
    await container.initServices();
    service.audit = jest.fn();
  });

  describe('createDraft', () => {
    it('should create new workflow draft', async () => {
      // BUILD
      const requestContextMock = {
        principalIdentifier: { uid: 'test-uid' },
        principal: { isAdmin: true },
      };

      workflowTemplateService.mustFindVersion = jest.fn(() => {
        return [
          {
            stepTemplateId: 'test-stepTemplateId',
            stepTemplateVer: 'test-stepTemplateVer',
            id: 'test-id',
            title: 'test-title',
            desc: 'test-desc',
            skippable: 'test-skippable',
            configs: {},
            propsOverrideOption: {},
            configOverrideOption: {},
          },
        ];
      });

      // OPERATE
      await service.createDraft(requestContextMock, {
        isNewWorkflow: true,
        workflowId: 'test-workflowId',
        workflowVer: 0,
        templateId: 'test-templateId',
        templateVer: 0,
      });

      // CHECK
      expect(workflowTemplateService.mustFindVersion).toHaveBeenCalled();
      expect(workflowService.prepareWorkflow).toHaveBeenCalled();
      expect(service.audit).toHaveBeenCalledWith(
        requestContextMock,
        expect.objectContaining({ action: 'create-workflow-draft' }),
      );
    });

    it('should look for existing workflow draft to create', async () => {
      // BUILD
      const requestContextMock = {
        principalIdentifier: { uid: 'test-uid' },
        principal: { isAdmin: true },
      };

      workflowService.mustFindVersion = jest.fn(() => {
        return {
          workflowTemplateId: 'test-workflowTemplateId',
          workflowTemplateVer: 'test-workflowTemplateVer',
        };
      });

      // OPERATE
      await service.createDraft(requestContextMock, {
        isNewWorkflow: false,
        workflowId: 'test-workflowId',
        workflowVer: 0,
        templateId: '',
        templateVer: 0,
      });

      // CHECK
      expect(workflowService.mustFindVersion).toHaveBeenCalled();
      expect(workflowService.prepareWorkflow).not.toHaveBeenCalled();
      expect(service.audit).toHaveBeenCalledWith(
        requestContextMock,
        expect.objectContaining({ action: 'create-workflow-draft' }),
      );
    });
  });

  describe('updateDraft', () => {
    it('should update workflow draft', async () => {
      // BUILD
      service.mustFindDraft = jest.fn(() => {
        return {
          uid: 'test-uid',
          workflow: { id: 'originalDraft-workflow-id', v: 'test-v' },
        };
      });
      const requestContextMock = {
        principalIdentifier: { uid: 'test-uid' },
        principal: { isAdmin: true },
      };

      const draft = {
        id: 'test-uid',
        workflow: { id: 'originalDraft-workflow-id', v: 'test-v' },
      };

      workflowService.mustFindVersion = jest.fn(() => {
        return {
          workflowTemplateId: 'test-workflowTemplateId',
          workflowTemplateVer: 'test-workflowTemplateVer',
        };
      });

      // OPERATE
      await service.updateDraft(requestContextMock, draft);

      // CHECK
      expect(workflowService.prepareWorkflow).toHaveBeenCalled();
      expect(service.audit).toHaveBeenCalledWith(
        requestContextMock,
        expect.objectContaining({ action: 'update-workflow-draft' }),
      );
    });
  });

  describe('publishDraft', () => {
    it('should publish draft', async () => {
      // BUILD
      const requestContextMock = { principal: { isAdmin: true } };

      service.updateDraft = jest.fn(() => {
        return {
          workflow: {
            id: 'test-workflow-id',
            rev: 0,
            v: '',
            updatedAt: '',
            updatedBy: '',
            createdAt: '',
            createdBy: '',
            stepsOrderChanged: '',
            selectedSteps: [{ propsOverrideOption: {}, configOverrideOption: {} }],
          },
        };
      });

      workflowService.findVersion = jest.fn(() => {
        return {
          v: 0,
        };
      });
      service.deleteDraft = jest.fn();

      // OPERATE
      await service.publishDraft(requestContextMock, { id: 'test-draft-id' });

      // CHECK
      expect(workflowService.findVersion).toHaveBeenCalled();
      expect(workflowService.createVersion).toHaveBeenCalled();
      expect(service.deleteDraft).toHaveBeenCalled();
      expect(service.audit).toHaveBeenCalledWith(
        requestContextMock,
        expect.objectContaining({ action: 'publish-workflow-draft' }),
      );
    });
  });

  describe('deleteDraft', () => {
    it('should delete draft', async () => {
      // BUILD
      const requestContextMock = {
        principalIdentifier: { uid: 'test-uid' },
        principal: { isAdmin: true },
      };
      service.mustFindDraft = jest.fn(() => {
        return { uid: 'test-uid' };
      });
      // OPERATE
      await service.deleteDraft(requestContextMock, { id: 'test-draft-id' });
      // CHECK
      expect(service.mustFindDraft).toHaveBeenCalled();
      expect(service.audit).toHaveBeenCalledWith(
        requestContextMock,
        expect.objectContaining({ action: 'delete-workflow-draft' }),
      );
    });
  });
});
