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

import StepRegistryService from '../step-registry-service';
import ServicesContainerMock from '../../../__mocks__/services-container.mock';
import inputSchema from '../../../schema/step-template.json';

describe('StepRegistryService', () => {
  let service;
  let container;
  let jsonSchemaValidationService;
  let pluginRegistryService;

  beforeEach(async () => {
    service = new StepRegistryService();
    // Initialize services container and register dependencies
    jsonSchemaValidationService = {
      ensureValid: jest.fn().mockResolvedValue(true),
    };
    pluginRegistryService = {
      getPlugins: jest.fn(() => {
        return [{ registerWorkflowSteps: jest.fn() }];
      }),
    };
    container = new ServicesContainerMock({
      service,
      jsonSchemaValidationService,
      pluginRegistryService,
    });
    await container.initServices();
  });

  describe('add', () => {
    it('should add step', async () => {
      // BUILD
      const definition = { id: 'test-definition-id', v: 1 };
      const implClass = {};
      service.findStep = jest.fn(() => {
        return false;
      });
      service.encodeId = jest.fn();
      // OPERATE
      await service.add({ definition, implClass });

      // CHECK
      expect(service.findStep).toHaveBeenCalledWith({ id: definition.id, v: definition.v });
      expect(jsonSchemaValidationService.ensureValid).toHaveBeenCalledWith(definition, inputSchema);
      expect(service.encodeId).toHaveBeenCalledWith({ id: definition.id, v: definition.v });
    });
  });

  describe('mustFindStep', () => {
    it('must find step', async () => {
      // BUILD
      service.findStep = jest.fn(() => {
        return true;
      });

      // OPERATE
      await service.mustFindStep({ id: 'test-id', v: 1 });

      // CHECK
      expect(service.findStep).toHaveBeenCalledWith({ id: 'test-id', v: 1 });
    });
  });
});
