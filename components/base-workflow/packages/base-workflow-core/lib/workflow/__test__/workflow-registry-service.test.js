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

import WorkflowRegistryService from '../workflow-registry-service';
import ServicesContainerMock from '../../__mocks__/services-container.mock';
import DbServiceMock from '../../__mocks__/db-service';
import inputSchema from '../../schema/workflow.json';

describe('WorkflowRegistryService', () => {
  let service;
  let container;
  let jsonSchemaValidationService;
  let pluginRegistryService;
  let dbService;
  beforeEach(async () => {
    service = new WorkflowRegistryService();

    dbService = new DbServiceMock();
    // Initialize services container and register dependencies
    jsonSchemaValidationService = {
      ensureValid: jest.fn().mockResolvedValue(true),
    };
    pluginRegistryService = {
      getPlugins: jest.fn(() => {
        return [{ registerWorkflows: jest.fn() }];
      }),
    };
    container = new ServicesContainerMock({
      service,
      jsonSchemaValidationService,
      dbService,
      pluginRegistryService,
    });
    await container.initServices();
  });

  describe('add', () => {
    it('should add service', async () => {
      // BUILD
      const definition = { id: 'test-yaml-id', v: 1 };
      service.findWorkflow = jest.fn();
      // OPERATE
      await service.add({ definition });

      // CHECK
      expect(service.findWorkflow).toHaveBeenCalledWith({ id: definition.id, v: definition.v });
      expect(jsonSchemaValidationService.ensureValid).toHaveBeenCalledWith(definition, inputSchema);
    });
  });
});
