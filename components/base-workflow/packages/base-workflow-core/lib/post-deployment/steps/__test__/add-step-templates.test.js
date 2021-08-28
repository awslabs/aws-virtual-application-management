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

import AddStepTemplates from '../add-step-templates';
import ServicesContainerMock from '../../../__mocks__/services-container.mock';

describe('AddStepTemplates', () => {
  let service;
  let container;
  let deploymentStoreService;
  let stepTemplateService;
  let stepRegistryService;
  let logMockService;
  const stepRegistryDefinition = { definition: 'test-definition' };
  const stepRegistryId = 'test-id';
  const stepRegistryV = 1;
  beforeEach(async () => {
    service = new AddStepTemplates();
    // Initialize services container and register dependencies
    deploymentStoreService = {
      find: jest.fn(() => {
        return { message: 'deploymentStoreService find success' };
      }),
      createOrUpdate: jest.fn(() => {
        return { message: 'deploymentStoreService create/update success' };
      }),
    };
    stepTemplateService = {
      findVersion: jest.fn(() => {
        return { message: 'stepTemplateService find version success' };
      }),
      createVersion: jest.fn(() => {
        return { message: 'stepTemplateService create version success' };
      }),
      updateVersion: jest.fn(() => {
        return { message: 'stepTemplateService create update success' };
      }),
    };
    stepRegistryService = {
      listSteps: jest.fn(() => {
        return [{ id: stepRegistryId, v: stepRegistryV, definition: stepRegistryDefinition }];
      }),
    };
    logMockService = {
      initService: jest.fn().mockResolvedValue(),
      info: jest.fn(),
    };
    container = new ServicesContainerMock({
      service,
      deploymentStoreService,
      stepTemplateService,
      stepRegistryService,
    });
    container.register('log', logMockService);
    await container.initServices();
  });

  describe('execute', () => {
    it('should add step templates', async () => {
      // BUILD
      service.findDeploymentItem = jest.fn();
      service.createVersion = jest.fn();
      service.createDeploymentItem = jest.fn();

      // OPERATE
      await service.execute();

      // CHECK
      expect(service.findDeploymentItem).toHaveBeenCalledTimes(1);
      expect(stepRegistryService.listSteps).toHaveBeenCalled();
      expect(service.createVersion).toHaveBeenCalledWith(stepRegistryDefinition);
      expect(service.createDeploymentItem).toHaveBeenCalledWith({
        encodedId: `${stepRegistryId}-${stepRegistryV}`,
        definitionStr: JSON.stringify(stepRegistryDefinition),
      });
    });
  });

  describe('findDeploymentItem', () => {
    it('should find deployment item', async () => {
      // BUILD
      // OPERATE
      const result = await service.findDeploymentItem({ id: 'test-id' });

      // CHECK
      expect(deploymentStoreService.find).toHaveBeenCalledTimes(1);
      expect(result).toEqual(expect.objectContaining({ message: 'deploymentStoreService find success' }));
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
      expect(result).toEqual(expect.objectContaining({ message: 'deploymentStoreService create/update success' }));
    });
  });

  describe('createVersion', () => {
    it('should create version with existing ID', async () => {
      // BUILD
      stepTemplateService.findVersion = jest.fn(() => {
        return true;
      });

      // OPERATE
      const result = await service.createVersion({ id: 'test-id', v: 1 });

      // CHECK
      expect(stepTemplateService.updateVersion).toHaveBeenCalledTimes(1);
      expect(stepTemplateService.createVersion).not.toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({ message: 'stepTemplateService create update success' }));
    });

    it('should create version with new ID', async () => {
      // BUILD
      stepTemplateService.findVersion = jest.fn(() => {
        return false;
      });
      // OPERATE
      const result = await service.createVersion({ id: 'test-id', v: 1 });

      // CHECK
      expect(stepTemplateService.updateVersion).not.toHaveBeenCalledTimes(1);
      expect(stepTemplateService.createVersion).toHaveBeenCalled();
      expect(result).toEqual(expect.objectContaining({ message: 'stepTemplateService create version success' }));
    });
  });
});
