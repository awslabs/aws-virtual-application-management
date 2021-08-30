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

import ServicesContainerMock from '../../../__mocks__/services-container.mock';
import AddWorkflowTriggers from '../add-workflow-triggers';

const triggerDefinition = { id: 'test-id', eventPattern: 'test-pattern' };
describe('AddWorkflowTriggers', () => {
  let service;
  let container;
  let deploymentStoreService;
  let workflowEventTriggersService;
  let workflowEventTriggersRegistryService;
  let logMockService;
  beforeEach(async () => {
    service = new AddWorkflowTriggers();
    // Initialize services container and register dependencies
    deploymentStoreService = {
      find: jest.fn(() => {
        return { msg: 'find deployment success' };
      }),
      createOrUpdate: jest.fn(() => {
        return { msg: 'create/update deployment success' };
      }),
    };
    workflowEventTriggersService = {
      create: jest.fn(() => {
        return { msg: 'create workflow version success' };
      }),
    };
    workflowEventTriggersRegistryService = {
      listEventTriggers: jest.fn(() => {
        return [triggerDefinition];
      }),
    };
    logMockService = {
      initService: jest.fn().mockResolvedValue(),
      info: jest.fn(),
    };
    container = new ServicesContainerMock({
      service,
      deploymentStoreService,
      workflowEventTriggersService,
      workflowEventTriggersRegistryService,
    });
    container.register('log', logMockService);
    await container.initServices();
  });

  describe('execute', () => {
    it('should add workflow event trigger', async () => {
      // BUILD
      deploymentStoreService.find = () => undefined;

      // OPERATE
      await service.execute();

      // CHECK
      expect(workflowEventTriggersService.create).toHaveBeenCalledWith(expect.anything(), triggerDefinition);
      expect(deploymentStoreService.createOrUpdate).toHaveBeenCalled();
    });

    it('should skip adding workflow event trigger', async () => {
      // BUILD
      deploymentStoreService.find = () => triggerDefinition;

      // OPERATE
      await service.execute();

      // CHECK
      expect(deploymentStoreService.createOrUpdate).not.toHaveBeenCalled();
      expect(workflowEventTriggersService.create).not.toHaveBeenCalled();
    });
  });
});
