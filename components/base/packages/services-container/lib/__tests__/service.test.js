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

import _ from 'lodash';
import { itProp, fc } from 'jest-fast-check';
import ServicesContainer from '../services-container';
import Service from '../service';
import Boom from '../boom';

// Service is intended to be abstract so we need to test a derived class
class TestService extends Service {}

function initBaseContainer() {
  const container = new ServicesContainer(['settings', 'log']);
  const mockService = {
    initService: jest.fn().mockResolvedValue(),
  };
  container.register('settings', mockService);
  container.register('log', mockService);
  return container;
}

describe('Service', () => {
  it('constructs with the expected values', () => {
    const service = new TestService();
    expect(service.deps).toEqual({});
    expect(service.optionalDeps).toEqual({});
    expect(service.boom).toBeInstanceOf(Boom);
    expect(service.initialized).toBe(false);
    expect(service.initializationPromise).toBeUndefined();
  });

  describe('.initService', () => {
    let container;
    beforeEach(async () => {
      container = new ServicesContainer();
      const mockService = { initService: jest.fn().mockResolvedValue() };
      container.register('settings', mockService);
      container.register('log', mockService);
      await container.initServices();
    });

    it('runs the init function', async () => {
      const service = new TestService();
      service.init = jest.fn().mockResolvedValue();

      await service.initService(container, { name: 'testService' });

      expect(service.init).toHaveBeenCalled();
    });

    it('runs the init function once', async () => {
      const service = new TestService();
      service.init = jest.fn().mockResolvedValue();

      await service.initService(container, { name: 'testService' });
      await service.initService(container, { name: 'testService' });
      await service.initService(container, { name: 'testService' });

      expect(service.init).toHaveBeenCalledTimes(1);
    });

    it('populates settings and log', async () => {
      const service = new TestService();
      service.init = jest.fn().mockResolvedValue();

      await service.initService(container, { name: 'testService' });

      expect(service.settings).toBeTruthy();
      expect(service.log).toBeTruthy();
    });

    itProp(
      'populates settings or logs when the service is called that',
      [fc.constantFrom('settings', 'log')],
      async name => {
        const service = new TestService();
        service.init = jest.fn().mockResolvedValue();

        await service.initService(container, { name });

        expect(service.settings).toBeFalsy();
        expect(service.log).toBeFalsy();
      },
    );
  });

  describe('.audit', () => {
    it('writes an audit event', async () => {
      const mockAuditResult = {};
      const testService = new TestService();
      testService.dependency('auditWriterService');
      const container = new ServicesContainer();
      const auditWriterService = {
        initService: jest.fn().mockResolvedValue(),
        writeAndForget: jest.fn().mockResolvedValue(mockAuditResult),
      };
      container.register('auditWriterService', auditWriterService);
      await container.initServices();

      await testService.initService(container, { name: 'testService' });

      const mockRequestContext = { request: 'context' };
      const auditEvent = { audit: 'event' };

      const result = await testService.audit(mockRequestContext, auditEvent);

      expect(auditWriterService.writeAndForget).toHaveBeenCalledWith(mockRequestContext, auditEvent);
      expect(result).toBe(mockAuditResult);
    });
  });

  describe('.settings', () => {
    it('throws when not initialized', () => {
      const testService = new TestService();
      expect(() => testService.settings).toThrow(
        'You tried to reference "settings" in a service but the service has not been initialized.',
      );
    });
  });

  describe('.log', () => {
    it('throws when not initialized', () => {
      const testService = new TestService();
      expect(() => testService.log).toThrow(
        'You tried to reference "log" in a service but the service has not been initialized.',
      );
    });
  });

  describe('.service', () => {
    let container;
    beforeEach(async () => {
      container = initBaseContainer();
    });

    itProp('throws when not initialized', [fc.string()], async serviceName => {
      const testService = new TestService();
      container.register('testService', testService);
      await expect(testService.service(serviceName)).rejects.toThrow(
        'You tried to use "service()" in a service but the service has not been initialized.',
      );
    });

    itProp('throws when the requested service is not declared as a dependency', [fc.string()], async serviceName => {
      // itProp doesn't re-run beforeEach
      container = initBaseContainer();
      const testService = new TestService();
      container.register('testService', testService, { lazy: false });
      await container.initServices();
      await expect(testService.service(serviceName)).rejects.toThrow(
        `The service "testService" tried to access the "${serviceName}" service, but it was not declared as a dependency.`,
      );
    });

    itProp(
      'does not throw when the requested service is not declared as a dependency but is a root service',
      [fc.constantFrom('settings', 'log')],
      async serviceName => {
        // itProp doesn't re-run beforeEach
        container = initBaseContainer();
        const testService = new TestService();
        container.register('testService', testService, { lazy: false });
        await container.initServices();
        await expect(testService.service(serviceName)).resolves.not.toThrow();
      },
    );

    itProp(
      'throws when the requested service is not found in the container',
      [fc.string({ minLength: 1 })],
      async serviceName => {
        // itProp doesn't re-run beforeEach
        container = initBaseContainer();
        const mockService = {
          deps: {},
          optionalDeps: {},
          dependency: jest.fn(),
          initService: jest.fn().mockResolvedValue(),
        };
        const testService = new TestService();
        testService.dependency(serviceName);
        container.register(serviceName, mockService);
        container.register('testService', testService, { lazy: false });

        await container.initServices();

        delete container.serviceMap[serviceName];

        await expect(testService.service(serviceName)).rejects.toThrow(
          `The service "testService" tried to access the "${serviceName}" service, but the "${serviceName}" service was not registered.`,
        );
      },
    );

    it('successfully returns a service', async () => {
      const testService = new TestService();
      container.register('testService', testService, { lazy: false });
      await container.initServices();
      const log = await testService.service('log');
      expect(log).toBeTruthy();
    });

    it('successfully returns a service (array version)', async () => {
      const testService = new TestService();
      container.register('testService', testService, { lazy: false });
      await container.initServices();
      const [log] = await testService.service(['log']);
      expect(log).toBeTruthy();
    });
  });

  describe('.optionalService', () => {
    let container;
    beforeEach(async () => {
      container = initBaseContainer();
    });

    itProp('throws when not initialized', [fc.string()], async serviceName => {
      const testService = new TestService();
      container.register('testService', testService);
      await expect(testService.optionalService(serviceName)).rejects.toThrow(
        'You tried to use "optionalService()" in a service but the service has not been initialized.',
      );
    });

    itProp('throws when the requested service is not declared as a dependency', [fc.string()], async serviceName => {
      // itProp doesn't re-run beforeEach
      container = initBaseContainer();
      const testService = new TestService();
      container.register('testService', testService, { lazy: false });
      await container.initServices();
      await expect(testService.optionalService(serviceName)).rejects.toThrow(
        `The service "testService" tried to access the "${serviceName}" service, but it was not declared as a dependency.`,
      );
    });

    itProp(
      'does not throw when the requested service is not declared as a dependency but is a root service',
      [fc.constantFrom('settings', 'log')],
      async serviceName => {
        // itProp doesn't re-run beforeEach
        container = initBaseContainer();
        const testService = new TestService();
        container.register('testService', testService, { lazy: false });
        await container.initServices();
        await expect(testService.optionalService(serviceName)).resolves.not.toThrow();
      },
    );

    itProp(
      'throws when the requested service is not found in the container',
      [fc.string({ minLength: 1 })],
      async serviceName => {
        // itProp doesn't re-run beforeEach
        container = initBaseContainer();
        const mockService = {
          deps: {},
          optionalDeps: {},
          dependency: jest.fn(),
          initService: jest.fn().mockResolvedValue(),
        };
        const testService = new TestService();
        testService.optionalDependency(serviceName);
        container.register(serviceName, mockService);
        container.register('testService', testService, { lazy: false });

        await container.initServices();

        delete container.serviceMap[serviceName];

        expect(await testService.optionalService(serviceName)).toBeFalsy();
      },
    );

    it('successfully returns a service', async () => {
      // itProp doesn't re-run beforeEach
      container = initBaseContainer();
      const mockService = {
        deps: {},
        optionalDeps: {},
        dependency: jest.fn(),
        initService: jest.fn().mockResolvedValue(),
      };
      const testService = new TestService();
      testService.optionalDependency('serviceName');
      container.register('serviceName', mockService, { lazy: false });
      container.register('testService', testService, { lazy: false });

      await container.initServices();

      expect(await testService.optionalService('serviceName')).toBe(mockService);
    });

    it('successfully returns a service (array version)', async () => {
      // itProp doesn't re-run beforeEach
      container = initBaseContainer();
      const mockService = {
        deps: {},
        optionalDeps: {},
        dependency: jest.fn(),
        initService: jest.fn().mockResolvedValue(),
      };
      const testService = new TestService();
      testService.optionalDependency('serviceName');
      container.register('serviceName', mockService, { lazy: false });
      container.register('testService', testService, { lazy: false });

      await container.initServices();

      expect(await testService.optionalService(['serviceName'])).toEqual([mockService]);
    });
  });

  describe('.dependency', () => {
    itProp('throws when initialised', [fc.string()], async dependency => {
      // itProp doesn't re-run beforeEach
      const container = initBaseContainer();
      const testService = new TestService();
      container.register('testService', testService, { lazy: false });

      await container.initServices();

      expect(() => testService.dependency(dependency)).toThrow(
        'You are trying to add dependency to the "testService" service, but the service has already been initialized.',
      );
    });

    itProp('throws when empty', [fc.string()], dependency => {
      fc.pre(!dependency);
      const testService = new TestService();
      expect(() => testService.dependency(dependency)).toThrow(
        'You tried to call "dependency()" in a service but you included an empty string.',
      );
    });

    it('throws when empty array', () => {
      const testService = new TestService();
      expect(() => testService.dependency([])).toThrow('You are trying to add an empty dependency to a service.');
    });

    itProp('throws when not a string', [fc.object()], dependency => {
      fc.pre(!_.isEmpty(dependency));
      const testService = new TestService();
      expect(() => testService.dependency([dependency])).toThrow(
        'You tried to call "dependency()" in a service but you included an item that is not a string.',
      );
    });

    itProp('successfully adds a dependency', [fc.string({ minLength: 1 })], dependency => {
      const testService = new TestService();
      testService.dependency(dependency);
      expect(testService.deps[dependency]).toBe(true);
    });
  });

  describe('.optionalDependency', () => {
    itProp('throws when initialised', [fc.string()], async dependency => {
      // itProp doesn't re-run beforeEach
      const container = initBaseContainer();
      const testService = new TestService();
      container.register('testService', testService, { lazy: false });

      await container.initServices();

      expect(() => testService.optionalDependency(dependency)).toThrow(
        'You are trying to add optional dependency to the "testService" service, but the service has already been initialized.',
      );
    });

    itProp('throws when empty', [fc.string()], dependency => {
      fc.pre(!dependency);
      const testService = new TestService();
      expect(() => testService.optionalDependency(dependency)).toThrow(
        'You tried to call "optionalDependency()" in a service but you included an empty string.',
      );
    });

    it('throws when empty array', () => {
      const testService = new TestService();
      expect(() => testService.optionalDependency([])).toThrow(
        'You are trying to add an empty optional dependency to a service.',
      );
    });

    itProp('throws when not a string', [fc.object()], dependency => {
      fc.pre(!_.isEmpty(dependency));
      const testService = new TestService();
      expect(() => testService.optionalDependency([dependency])).toThrow(
        'You tried to call "optionalDependency()" in a service but you included an item that is not a string.',
      );
    });

    itProp('successfully adds a dependency', [fc.string({ minLength: 1 })], dependency => {
      const testService = new TestService();
      testService.optionalDependency(dependency);
      expect(testService.optionalDeps[dependency]).toBe(true);
    });
  });
});
