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

import AddWorkflowTemplates from '../add-workflow-templates';
import ServicesContainerMock from '../../../__mocks__/services-container.mock';

describe('AddWorkflowTemplates', () => {
  let service;
  let container;
  let deploymentStoreService;
  let workflowTemplateService;
  let workflowTemplateRegistryService;
  let logMockService;
  beforeEach(async () => {
    service = new AddWorkflowTemplates();
    // Initialize services container and register dependencies
    deploymentStoreService = {
      find: jest.fn(() => {
        return { message: 'find deployment success' };
      }),
      createOrUpdate: jest.fn(() => {
        return { message: 'create/update deployment success' };
      }),
    };
    workflowTemplateService = {
      findVersion: jest.fn(() => {
        return { message: 'find workflow version success' };
      }),
      createVersion: jest.fn(() => {
        return { message: 'create workflow version success' };
      }),
      updateVersion: jest.fn(() => {
        return { message: 'update workflow version success' };
      }),
    };
    workflowTemplateRegistryService = {
      listWorkflowTemplates: jest.fn(() => {
        return [{ id: 'test-id', v: 1, definition: 'test-definition' }];
      }),
    };
    logMockService = {
      initService: jest.fn().mockResolvedValue(),
      info: jest.fn(),
    };
    container = new ServicesContainerMock({
      service,
      deploymentStoreService,
      workflowTemplateService,
      workflowTemplateRegistryService,
    });
    container.register('log', logMockService);
    await container.initServices();
  });

  describe('execute', () => {
    it('should add workflow templates', async () => {
      // BUILD
      const definition = { id: 'test-definition-id', v: 1 };
      service.findDeploymentItem = jest.fn();
      service.createVersion = jest.fn();
      service.createDeploymentItem = jest.fn();
      // OPERATE
      await service.execute({ definition });

      // CHECK
      expect(service.findDeploymentItem).toHaveBeenCalledTimes(1);
      expect(workflowTemplateRegistryService.listWorkflowTemplates).toHaveBeenCalled();
      expect(service.createVersion).toHaveBeenCalled();
      expect(service.createDeploymentItem).toHaveBeenCalled();
    });
  });

  describe('findDeploymentItem', () => {
    it('should find deployment item', async () => {
      // BUILD
      // OPERATE
      const result = await service.findDeploymentItem({ id: 'test-id' });

      // CHECK
      expect(deploymentStoreService.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expect.objectContaining({ message: 'find deployment success' }));
    });
  });

  describe('createDeploymentItem', () => {
    it('should create deployment item', async () => {
      // BUILD
      // OPERATE
      const result = await service.createDeploymentItem({
        encodedId: 'test-encodedId',
        definitionStr: 'test-definitionStr',
      });

      // CHECK
      expect(deploymentStoreService.createOrUpdate).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expect.objectContaining({ message: 'create/update deployment success' }));
    });
  });

  describe('createVersion', () => {
    it('should create version with existing ID', async () => {
      // BUILD
      workflowTemplateService.findVersion = jest.fn(() => {
        return true;
      });
      // OPERATE
      const result = await service.createVersion({ id: 'test-id', v: 1 });

      // CHECK
      expect(workflowTemplateService.updateVersion).toHaveBeenCalledTimes(1);
      expect(workflowTemplateService.createVersion).not.toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({ message: 'update workflow version success' }));
    });

    it('should create version with new ID', async () => {
      // BUILD
      workflowTemplateService.findVersion = jest.fn(() => {
        return false;
      });
      // OPERATE
      const result = await service.createVersion({ id: 'test-id', v: 1 });

      // CHECK
      expect(workflowTemplateService.updateVersion).not.toHaveBeenCalledTimes(1);
      expect(workflowTemplateService.createVersion).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({ message: 'create workflow version success' }));
    });
  });
});
