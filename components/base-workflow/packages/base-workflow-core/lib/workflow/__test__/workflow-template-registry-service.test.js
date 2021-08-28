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

import WorkflowTemplateRegistryService from '../workflow-template-registry-service';
import ServicesContainerMock from '../../__mocks__/services-container.mock';
import SettingsServiceMock from '../../__mocks__/settings-service.mock';
import inputSchema from '../../schema/workflow-template.json';

const settings = {
  tableName: 'test-tableName',
};

describe('WorkflowTemplateRegistryService', () => {
  let service;
  let container;
  let jsonSchemaValidationService;
  let pluginRegistryService;
  const definition = { id: 'test-definition-id', v: 'test-v' };
  beforeEach(async () => {
    service = new WorkflowTemplateRegistryService();

    // Initialize services container and register dependencies
    jsonSchemaValidationService = {
      ensureValid: jest.fn().mockResolvedValue(true),
    };

    pluginRegistryService = {
      getPlugins: jest.fn(() => {
        return [];
      }),
    };

    container = new ServicesContainerMock({
      service,
      jsonSchemaValidationService,
      settings: new SettingsServiceMock(settings),
      pluginRegistryService,
    });
    await container.initServices();
    service.audit = jest.fn();
  });

  describe('add', () => {
    it('should add new workflow template', async () => {
      // BUILD
      service.findWorkflowTemplate = jest.fn(() => {
        return false;
      });
      // OPERATE
      await service.add({ definition });

      // CHECK
      expect(service.findWorkflowTemplate).toHaveBeenCalledWith({ id: definition.id, v: definition.v });
      expect(jsonSchemaValidationService.ensureValid).toHaveBeenCalledWith(definition, inputSchema);
    });
  });

  describe('findWorkflowTemplate', () => {
    it('should find workflow template', async () => {
      // BUILD
      service.encodeId = jest.fn();

      // OPERATE
      service.findWorkflowTemplate({ id: 'test-id', v: 1 });

      // CHECK
      expect(service.encodeId).toHaveBeenCalledWith({ id: 'test-id', v: 1 });
    });
  });
});
