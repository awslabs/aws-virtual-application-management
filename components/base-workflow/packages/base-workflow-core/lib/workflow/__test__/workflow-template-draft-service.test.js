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

import WorkflowTemplateDraftService from '../workflow-template-draft-service';
import ServicesContainerMock from '../../__mocks__/services-container.mock';
import SettingsServiceMock from '../../__mocks__/settings-service.mock';
import DbServiceMock from '../../__mocks__/db-service';

const settings = {
  tableName: 'test-tableName',
};

describe('WorkflowTemplateDraftService', () => {
  let service;
  let container;
  let jsonSchemaValidationService;
  let auditWriterService;
  let dbService;
  let workflowService;
  let workflowTemplateService;
  let stepTemplateService;
  beforeEach(async () => {
    service = new WorkflowTemplateDraftService();
    dbService = new DbServiceMock();
    // Initialize services container and register dependencies
    jsonSchemaValidationService = {
      ensureValid: jest.fn().mockResolvedValue(true),
    };
    auditWriterService = { writeAndForget: jest.fn() };
    workflowService = {
      mustFindVersion: jest.fn(() => {
        return { id: 'test-workflow-id', selectedSteps: [{}, {}] };
      }),
    };
    workflowTemplateService = {
      findVersion: jest.fn(),
      mustFindVersion: jest.fn(),
      populateSteps: jest.fn(),
      createVersion: jest.fn(),
    };
    stepTemplateService = {};

    container = new ServicesContainerMock({
      service,
      jsonSchemaValidationService,
      settings: new SettingsServiceMock(settings),
      dbService,
      auditWriterService,
      workflowService,
      workflowTemplateService,
      stepTemplateService,
    });
    await container.initServices();
    service.audit = jest.fn();
    service.mustFindDraft = jest.fn(() => {
      return { uid: 'test-uid', template: { id: 'test-template', v: 'test-v' } };
    });
  });

  describe('createDraft', () => {
    it('should create workflow template draft if is new template', async () => {
      // BUILD
      const requestContextMock = {
        principal: { isAdmin: true },
      };
      const contentMock = {
        isNewTemplate: true,
        templateId: 'test-templateIdRaw',
        templateTitle: 'test-templateTitle',
        templateVer: 0,
      };
      // OPERATE
      await service.createDraft(requestContextMock, contentMock);

      // CHECK
      expect(workflowTemplateService.findVersion).toHaveBeenCalled();
      expect(workflowTemplateService.mustFindVersion).not.toHaveBeenCalled();
      expect(service.audit).toHaveBeenCalledWith(
        requestContextMock,
        expect.objectContaining({
          action: 'create-workflow-template-draft',
        }),
      );
    });

    it('should create workflow template draft if is NOT new template', async () => {
      // BUILD
      const requestContextMock = {
        principal: { isAdmin: true },
      };
      const contentMock = {
        isNewTemplate: false,
        templateId: 'test-templateIdRaw',
        templateVer: 0,
      };
      // OPERATE
      await service.createDraft(requestContextMock, contentMock);

      // CHECK
      expect(workflowTemplateService.findVersion).not.toHaveBeenCalled();
      expect(workflowTemplateService.mustFindVersion).toHaveBeenCalled();
      expect(service.audit).toHaveBeenCalledWith(
        requestContextMock,
        expect.objectContaining({
          action: 'create-workflow-template-draft',
        }),
      );
    });
  });
  describe('updateDraft', () => {
    it('should update workflow template draft', async () => {
      // BUILD
      const requestContextMock = {
        principalIdentifier: { uid: 'test-uid' },
        principal: { isAdmin: true },
      };
      const draftMock = {
        template: { id: 'test-template', v: 'test-v' },
        id: 'test.id',
      };
      // OPERATE
      await service.updateDraft(requestContextMock, draftMock);

      // CHECK
      expect(workflowTemplateService.mustFindVersion).not.toHaveBeenCalled();
      expect(workflowTemplateService.findVersion).not.toHaveBeenCalled();
      expect(service.audit).toHaveBeenCalledWith(
        requestContextMock,
        expect.objectContaining({
          action: 'update-workflow-template-draft',
        }),
      );
    });
  });

  describe('publishDraft', () => {
    it('should publish workflow template draft', async () => {
      // BUILD
      const requestContextMock = {
        principalIdentifier: { uid: 'test-uid' },
        principal: { isAdmin: true },
      };
      const draftMock = {
        template: { id: 'test-template', v: 'test-v' },
        id: 'test.id',
      };

      service.deleteDraft = jest.fn();
      service.updateDraft = jest.fn(() => {
        return { template: [{ stepTemplate: '', isNew: '', v: 0 }] };
      });
      // OPERATE
      await service.publishDraft(requestContextMock, draftMock);

      // CHECK
      expect(service.updateDraft).toHaveBeenCalled();
      expect(workflowTemplateService.findVersion).toHaveBeenCalled();
      expect(workflowTemplateService.createVersion).toHaveBeenCalled();
      expect(service.audit).toHaveBeenCalledWith(
        requestContextMock,
        expect.objectContaining({
          action: 'publish-workflow-template-draft',
        }),
      );
    });
  });

  describe('deleteDraft', () => {
    it('should delete workflow template draft', async () => {
      // BUILD
      const requestContextMock = {
        principalIdentifier: { uid: 'test-uid' },
        principal: { isAdmin: true },
      };

      // OPERATE
      await service.deleteDraft(requestContextMock, { id: 'test-id' });

      // CHECK
      expect(service.mustFindDraft).toHaveBeenCalled();
      expect(service.audit).toHaveBeenCalledWith(
        requestContextMock,
        expect.objectContaining({
          action: 'delete-workflow-template-draft',
        }),
      );
    });
  });
});
