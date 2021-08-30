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

import { ServicesContainer } from '@aws-ee/base-services-container';
import { PluginRegistryService } from '@aws-ee/base-services';
import { registerSteps } from '../steps-registration-util';
import SettingsServiceMock from '../__mocks__/settings-service.mock';
import StepServiceMock from '../__mocks__/step-service.mock';

const settings = {
  dbDeploymentStore: 'dbMockDeploymentStore',
};

describe('registerSteps', () => {
  describe('no plugins', () => {
    let container;
    let logServiceMock;
    let pluginRegistryService;

    beforeEach(async () => {
      container = new ServicesContainer();
      pluginRegistryService = new PluginRegistryService({ getPlugins: () => [] });

      logServiceMock = {
        initService: jest.fn(),
        error: jest.fn(),
      };

      container.register('log', logServiceMock);
      container.register('settings', new SettingsServiceMock(settings));
      container.register('pluginRegistryService', pluginRegistryService, { lazy: false });
    });

    it('returns an empty map if no steps are registered via plugins', async () => {
      const result = await registerSteps(container, pluginRegistryService);
      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });
  });

  describe('with plugins', () => {
    let container;
    let logServiceMock;
    let pluginRegistryService;

    const stepService1 = new StepServiceMock('service1');
    const stepService2 = new StepServiceMock('service2');

    const plugin1 = {
      getSteps: async stepsSoFar => {
        const stepsMap = new Map([...stepsSoFar, ['step1', stepService1]]);
        return stepsMap;
      },
    };

    const plugin2 = {
      getSteps: async stepsSoFar => {
        const stepsMap = new Map([...stepsSoFar, ['step2', stepService2]]);
        return stepsMap;
      },
    };

    beforeEach(async () => {
      container = new ServicesContainer();
      pluginRegistryService = new PluginRegistryService({
        getPlugins: () => [plugin1, plugin2],
      });

      logServiceMock = {
        initService: jest.fn(),
        error: jest.fn(),
      };

      container.register('log', logServiceMock);
      container.register('settings', new SettingsServiceMock(settings));
      container.register('pluginRegistryService', pluginRegistryService, { lazy: false });
    });

    it('returns a map with steps registered via plugins', async () => {
      const result = await registerSteps(container, pluginRegistryService);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(2);

      await container.initServices();

      const step1 = await container.find('step1');
      const step2 = await container.find('step2');

      expect(step1.getName()).toBe('service1');
      expect(step2.getName()).toBe('service2');
    });
  });
});
