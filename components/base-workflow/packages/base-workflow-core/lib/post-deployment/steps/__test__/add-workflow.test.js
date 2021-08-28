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

import AddWorkflows from '../add-workflows';
import ServicesContainerMock from '../../../__mocks__/services-container.mock';

describe('AddWorkflows', () => {
  let service;
  let container;
  let deploymentStoreService;
  let workflowService;
  let workflowRegistryService;
  let logMockService;
  beforeEach(async () => {
    service = new AddWorkflows();
    // Initialize services container and register dependencies
    deploymentStoreService = {
      find: jest.fn(() => {
        return { msg: 'find deployment success' };
      }),
      createOrUpdate: jest.fn(() => {
        return { msg: 'create/update deployment success' };
      }),
    };
    workflowService = {
      findVersion: jest.fn(() => {
        return { msg: 'find workflow version success' };
      }),
      createVersion: jest.fn(() => {
        return { msg: 'create workflow version success' };
      }),
      updateVersion: jest.fn(() => {
        return { msg: 'update workflow version success' };
      }),
    };
    workflowRegistryService = {
      listWorkflows: jest.fn(() => {
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
      workflowService,
      workflowRegistryService,
    });
    container.register('log', logMockService);
    await container.initServices();
  });

  describe('execute', () => {
    it('should add step templates', async () => {
      // BUILD
      const definition = { id: 'test-definition-id', v: 1 };
      service.findDeploymentItem = jest.fn();
      service.createVersion = jest.fn();
      service.createDeploymentItem = jest.fn();
      // OPERATE
      await service.execute({ definition });

      // CHECK
      expect(workflowRegistryService.listWorkflows).toHaveBeenCalled();
      expect(service.createVersion).toHaveBeenCalled();
      expect(service.createDeploymentItem).toHaveBeenCalled();
      expect(service.findDeploymentItem).toHaveBeenCalled();
    });
  });

  describe('findDeploymentItem', () => {
    it('should find deployment item', async () => {
      // BUILD
      // OPERATE
      const result = await service.findDeploymentItem({ id: 'test-id' });

      // CHECK
      expect(deploymentStoreService.find).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({ msg: 'find deployment success' }));
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
      expect(result).toEqual(expect.objectContaining({ msg: 'create/update deployment success' }));
    });
  });

  describe('createVersion', () => {
    it('should create version with existing ID', async () => {
      // BUILD
      workflowService.findVersion = jest.fn(() => {
        return true;
      });
      // OPERATE
      const result = await service.createVersion({ id: 'test-id', v: 1 });

      // CHECK
      expect(workflowService.updateVersion).toHaveBeenCalledTimes(1);
      expect(workflowService.createVersion).not.toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({ msg: 'update workflow version success' }));
    });

    it('should create version with new ID', async () => {
      // BUILD
      workflowService.findVersion = jest.fn(() => {
        return false;
      });
      // OPERATE
      const result = await service.createVersion({ id: 'test-id', v: 1 });

      // CHECK
      expect(workflowService.updateVersion).not.toHaveBeenCalledTimes(1);
      expect(workflowService.createVersion).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({ msg: 'create workflow version success' }));
    });
  });
});
