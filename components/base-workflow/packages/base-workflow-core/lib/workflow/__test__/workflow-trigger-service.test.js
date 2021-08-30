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

import WorkflowTriggerService from '../workflow-trigger-service';
import ServicesContainerMock from '../../__mocks__/services-container.mock';
import SettingsServiceMock from '../../__mocks__/settings-service.mock';

const settings = {
  tableName: 'test-tableName',
};

describe('WorkflowTriggerService', () => {
  let service;
  let container;
  let jsonSchemaValidationService;
  let workflowService;
  let workflowInstanceService;
  beforeEach(async () => {
    service = new WorkflowTriggerService();
    // Initialize services container and register dependencies
    jsonSchemaValidationService = {
      ensureValid: jest.fn().mockResolvedValue(true),
    };
    workflowService = {
      mustFindVersion: jest.fn(() => {
        return { id: 'test-workflow-id', selectedSteps: [{}, {}] };
      }),
      findVersion: jest.fn(() => {
        return { ver: 0 };
      }),
    };
    workflowInstanceService = {
      createInstance: jest.fn(() => {
        return { runSpec: { target: 'stepFunctions' } };
      }),
    };
    container = new ServicesContainerMock({
      service,
      jsonSchemaValidationService,
      settings: new SettingsServiceMock(settings),
      workflowService,
      workflowInstanceService,
    });
    await container.initServices();
    service.audit = jest.fn();
    service.internals.triggerStepFunctions = jest.fn();
  });

  describe('triggerWorkflow', () => {
    it('should trigger workflow with latest version', async () => {
      // BUILD
      const requestContextMock = {
        principal: { isAdmin: true },
      };
      const meta = { workflowVer: 1, workflowId: 'test-workflowId' };
      const input = {};
      // OPERATE
      await service.triggerWorkflow(requestContextMock, meta, input);

      // CHECK
      expect(workflowService.findVersion).not.toHaveBeenCalled();
      expect(workflowInstanceService.createInstance).toHaveBeenCalledWith(requestContextMock, meta, input);
    });

    it('should trigger workflow without latest version', async () => {
      // BUILD
      const requestContextMock = {
        principal: { isAdmin: true },
      };
      const meta = { workflowId: 'test-workflowId' };
      const input = {};

      // OPERATE
      await service.triggerWorkflow(requestContextMock, meta, input);

      // CHECK
      expect(workflowService.findVersion).toHaveBeenCalledWith(requestContextMock, { id: meta.workflowId });
      expect(workflowInstanceService.createInstance).toHaveBeenCalledWith(requestContextMock, meta, input);
    });
  });
});
