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

import WorkflowInstanceService from '../workflow-instance-service';
import ServicesContainerMock from '../../__mocks__/services-container.mock';
import SettingsServiceMock from '../../__mocks__/settings-service.mock';
import DbServiceMock from '../../__mocks__/db-service';

const settings = {
  tableName: 'test-tableName',
};

describe('WorkflowInstanceService', () => {
  let service;
  let container;
  let jsonSchemaValidationService;
  let auditWriterService;
  let dbService;
  let workflowService;
  const workflowServiceFindWorkflowId = 'test-workflow-id';
  beforeEach(async () => {
    service = new WorkflowInstanceService();
    dbService = new DbServiceMock();
    // Initialize services container and register dependencies
    jsonSchemaValidationService = {
      ensureValid: jest.fn().mockResolvedValue(true),
    };
    auditWriterService = { writeAndForget: jest.fn() };
    workflowService = {
      mustFindVersion: jest.fn(() => {
        return { id: workflowServiceFindWorkflowId, selectedSteps: [{}, {}] };
      }),
    };

    container = new ServicesContainerMock({
      service,
      jsonSchemaValidationService,
      settings: new SettingsServiceMock(settings),
      dbService,
      auditWriterService,
      workflowService,
    });
    await container.initServices();
    service.audit = jest.fn();
  });

  describe('createInstance', () => {
    it('should create workflow instance', async () => {
      // BUILD
      const requestContextMock = {
        principal: { isAdmin: true },
        principalIdentifier: { uid: 'test-uid' },
      };
      const meta = {
        workflowId: 'test-workflowId',
        workflowVer: 'test-workflowVer',
        runSpec: 'test-runSpec',
        status: 'test-status',
        eventTriggerId: 'test-eventTriggerId',
      };
      const input = {};

      service.prepareNewInstance = jest.fn(() => {
        return { id: 'test-work-id' };
      });

      // OPERATE
      const result = await service.createInstance(requestContextMock, meta, input);

      // CHECK
      expect(workflowService.mustFindVersion).toHaveBeenCalled();
      expect(service.audit).toHaveBeenCalledWith(
        requestContextMock,
        expect.objectContaining({
          action: 'create-workflow-instance',
        }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          createdBy: requestContextMock.principalIdentifier.uid,
          eventTriggerId: meta.eventTriggerId,
          updatedBy: requestContextMock.principalIdentifier.uid,
          wfId: workflowServiceFindWorkflowId,
          wfStatus: meta.status,
        }),
      );
    });
  });

  describe('changeWorkflowStatus', () => {
    it('should change workflow instance status', async () => {
      // BUILD
      const input = {
        instanceId: 'test-instanceId',
        status: 'test-status',
        clearMessage: false,
        message: 'test-message',
      };
      service.boom.badRequest = jest.fn();

      // OPERATE
      await service.changeWorkflowStatus(input);

      // CHECK
      expect(service.boom.badRequest).not.toHaveBeenCalled();
    });
  });

  describe('saveStepAttribs', () => {
    it('should save step attributes with attribs specified', async () => {
      // BUILD
      const requestContextMock = { principal: { isAdmin: true } };
      const input = {
        instanceId: 'test-instanceId',
        stepIndex: 'test-stepIndex',
        attribs: 'test-attribs',
      };
      service.findInstance = jest.fn(() => {
        return { wfId: '', wfVer: 0, stAttribs: { existingStepAttribs: {} }, workflowInstance: 'test-instance' };
      });
      service.boom.badRequest = jest.fn();

      // OPERATE
      await service.saveStepAttribs(requestContextMock, input);

      // CHECK
      expect(service.boom.badRequest).not.toHaveBeenCalled();
      expect(workflowService.mustFindVersion).toHaveBeenCalled();
      expect(service.audit).toHaveBeenCalledWith(
        requestContextMock,
        expect.objectContaining({ action: 'save-workflow-instance-step-attributes' }),
      );
    });

    it('should save step attributes without attribs specified', async () => {
      // BUILD
      const requestContextMock = { principal: { isAdmin: true } };
      const input = {
        instanceId: 'test-instanceId',
        stepIndex: 'test-stepIndex',
      };
      service.findInstance = jest.fn(() => {
        return { wfId: '', wfVer: 0, stAttribs: { existingStepAttribs: {} }, workflowInstance: 'test-instance' };
      });
      service.boom.badRequest = jest.fn();

      // OPERATE
      await service.saveStepAttribs(requestContextMock, input);

      // CHECK
      expect(service.boom.badRequest).not.toHaveBeenCalled();
      expect(workflowService.mustFindVersion).toHaveBeenCalled();
      expect(service.audit).toHaveBeenCalledWith(
        requestContextMock,
        expect.objectContaining({ action: 'save-workflow-instance-step-attributes' }),
      );
    });
  });

  describe('changeStepStatus', () => {
    it('should change step status with all specified', async () => {
      // BUILD
      const input = {
        instanceId: 'test-instanceId',
        stepIndex: 'test-stepIndex',
        status: 'test-status',
        clearMessage: true,
        message: 'test-message',
        startTime: 'test-startTime',
        endTime: 'test-endTime',
      };
      service.boom.badRequest = jest.fn();

      // OPERATE
      await service.changeStepStatus(input);

      // CHECK
      expect(service.boom.badRequest).not.toHaveBeenCalled();
    });

    it('should change step status with without clearMessage specified', async () => {
      // BUILD
      const input = {
        instanceId: 'test-instanceId',
        stepIndex: 'test-stepIndex',
        status: 'test-status',
        clearMessage: false,
        message: 'test-message',
        startTime: 'test-startTime',
        endTime: 'test-endTime',
      };
      service.boom.badRequest = jest.fn();

      // OPERATE
      await service.changeStepStatus(input);

      // CHECK
      expect(service.boom.badRequest).not.toHaveBeenCalled();
    });

    it('should change step status with without status specified', async () => {
      // BUILD
      const input = {
        instanceId: 'test-instanceId',
        stepIndex: 'test-stepIndex',
        clearMessage: true,
        message: 'test-message',
        startTime: 'test-startTime',
        endTime: 'test-endTime',
      };
      service.boom.badRequest = jest.fn();

      // OPERATE
      await service.changeWorkflowStatus(input);

      // CHECK
      expect(service.boom.badRequest).not.toHaveBeenCalled();
    });

    it('should change step status without startTime specified', async () => {
      // BUILD
      const input = {
        instanceId: 'test-instanceId',
        stepIndex: 'test-stepIndex',
        status: 'test-status',
        clearMessage: true,
        message: 'test-message',
        endTime: 'test-endTime',
      };
      service.boom.badRequest = jest.fn();

      // OPERATE
      await service.changeWorkflowStatus(input);

      // CHECK
      expect(service.boom.badRequest).not.toHaveBeenCalled();
    });

    it('should change step status without endTime specified', async () => {
      // BUILD
      const input = {
        instanceId: 'test-instanceId',
        stepIndex: 'test-stepIndex',
        status: 'test-status',
        clearMessage: true,
        message: 'test-message',
        startTime: 'test-startTime',
      };
      service.boom.badRequest = jest.fn();

      // OPERATE
      await service.changeWorkflowStatus(input);

      // CHECK
      expect(service.boom.badRequest).not.toHaveBeenCalled();
    });
  });
});
