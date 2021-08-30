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

import { itProp, fc } from 'jest-fast-check';
import ServicesContainer from '../services-container';

describe('ServicesContainer', () => {
  it('constructs with empty roots', () => {
    const container = new ServicesContainer();
    expect({ ...container }).toEqual({
      initialized: false,
      roots: {},
      serviceMap: {},
    });
  });

  itProp('constructs with list of roots', [fc.array(fc.string())], roots => {
    const container = new ServicesContainer(roots);
    expect(container.roots).toEqual(roots.reduce((result, name) => ({ ...result, [name]: true }), {}));
  });

  describe('.isRoot', () => {
    itProp('returns true for root services', [fc.array(fc.string())], roots => {
      const container = new ServicesContainer(roots);

      roots.forEach(root => {
        expect(container.isRoot(root)).toBe(true);
      });
    });

    itProp('returns false for non-root services', [fc.array(fc.string()), fc.string()], (roots, name) => {
      fc.pre(!roots.includes(name));

      const container = new ServicesContainer(roots);

      expect(container.isRoot(name)).toBe(false);
    });
  });

  describe('.register', () => {
    itProp(
      'errors when the container is already initialized',
      [fc.string({ minLength: 1 }), fc.object()],
      async (name, instance) => {
        fc.pre(!!instance);
        const container = new ServicesContainer();
        await container.initServices();
        expect(() => container.register(name, instance)).toThrow(
          `You tried to register a service "${name}" after the service initialization stage had completed.`,
        );
      },
    );

    itProp('errors when the service name is empty', [fc.string(), fc.object()], (name, instance) => {
      fc.pre(!name);
      const container = new ServicesContainer();
      expect(() => container.register(name, instance)).toThrow(
        'You tried to register a service, but you did not provide a name.',
      );
    });

    itProp('errors when no instance is passed', [fc.string({ minLength: 1 }), fc.anything()], (name, instance) => {
      fc.pre(typeof instance !== 'object');
      const container = new ServicesContainer();
      expect(() => container.register(name, instance)).toThrow(
        `You tried to register a service named "${name}", but you didn't provide an instance of the service.`,
      );
    });

    itProp('adds root dependencies to the service', [fc.array(fc.string())], roots => {
      const container = new ServicesContainer(roots);
      const service = {
        deps: {},
        optionalDeps: {},
        dependency: jest.fn(),
      };
      container.register('newService', service);

      roots.forEach(root => {
        expect(service.dependency).toHaveBeenCalledWith(root);
      });
    });

    itProp(
      'does not add root dependencies when they are already referenced',
      [fc.array(fc.string({ minLength: 1 }))],
      roots => {
        const container = new ServicesContainer(roots);
        const service = {
          deps: roots.reduce((prev, key) => ({ ...prev, [key]: true }), {}),
          optionalDeps: {},
          dependency: jest.fn(),
        };
        container.register('newService', service);

        expect(service.dependency).not.toHaveBeenCalled();
      },
    );

    itProp(
      'does not add root dependencies when they are already referenced as optionals',
      [fc.array(fc.string({ minLength: 1 }))],
      roots => {
        const container = new ServicesContainer(roots);
        const service = {
          deps: {},
          optionalDeps: roots.reduce((prev, key) => ({ ...prev, [key]: true }), {}),
          dependency: jest.fn(),
        };
        container.register('newService', service);

        expect(service.dependency).not.toHaveBeenCalled();
      },
    );

    itProp('does not add root dependencies to a root service', [fc.array(fc.string({ minLength: 1 }))], roots => {
      fc.pre(roots.length > 0);
      const container = new ServicesContainer(roots);
      const service = {
        deps: {},
        optionalDeps: {},
        dependency: jest.fn(),
      };
      container.register(roots[0], service);

      expect(service.dependency).not.toHaveBeenCalled();
    });
  });

  describe('.initServices', () => {
    it('runs initService on each non-lazy service', async () => {
      const container = new ServicesContainer();
      const service = {
        deps: {},
        optionalDeps: {},
        dependency: jest.fn(),
        initService: jest.fn().mockResolvedValue(),
      };
      container.register('mockService', service, { lazy: false });
      await container.initServices();
      expect(service.initService).toHaveBeenCalledWith(container, { name: 'mockService' });
    });

    it('does not run initService on already initialised services', async () => {
      const container = new ServicesContainer();
      const service = {
        deps: {},
        optionalDeps: {},
        initialized: true,
        dependency: jest.fn(),
        initService: jest.fn().mockResolvedValue(),
      };
      container.register('mockService', service, { lazy: false });
      await container.initServices();
      expect(service.initService).not.toHaveBeenCalled();
    });

    it('does not run initService on lazy services', async () => {
      const container = new ServicesContainer();
      const service = {
        deps: {},
        optionalDeps: {},
        dependency: jest.fn(),
        initService: jest.fn().mockResolvedValue(),
      };
      container.register('mockService', service);
      await container.initServices();
      expect(service.initService).not.toHaveBeenCalled();
    });
  });

  describe('.find', () => {
    it('throws when the container is not initialized', async () => {
      const container = new ServicesContainer();
      await expect(container.find('')).rejects.toThrow(
        'You tried to call find() before the service container was initialized.',
      );
    });

    itProp('returns undefined for an unknown service', [fc.string()], async serviceName => {
      const container = new ServicesContainer();
      await container.initServices();

      const result = await container.find(serviceName);

      expect(result).toBeUndefined();
    });

    itProp('returns the registered service', [fc.string({ minLength: 1 })], async serviceName => {
      const container = new ServicesContainer();
      const service = {
        initService: jest.fn().mockResolvedValue(),
      };
      container.register(serviceName, service);
      await container.initServices();

      const result = await container.find(serviceName);

      expect(result).toBe(service);
    });

    itProp('calls initService if the service is not initialized', [fc.string({ minLength: 1 })], async serviceName => {
      const container = new ServicesContainer();
      const service = {
        initService: jest.fn().mockResolvedValue(),
      };
      container.register(serviceName, service);
      await container.initServices();

      await container.find(serviceName);

      expect(service.initService).toHaveBeenCalledWith(container, { name: serviceName });
    });

    itProp(
      'does not call initService if the service is already initialized',
      [fc.string({ minLength: 1 })],
      async serviceName => {
        const container = new ServicesContainer();
        const service = {
          initialized: true,
          initService: jest.fn().mockResolvedValue(),
        };
        container.register(serviceName, service);
        await container.initServices();

        await container.find(serviceName);

        expect(service.initService).not.toHaveBeenCalled();
      },
    );
  });

  describe('.validate', () => {
    it('throws on a missing dependency', () => {
      const container = new ServicesContainer();
      const service = {
        deps: { missingDep: true },
      };
      container.register('serviceA', service);
      expect(() => container.validate()).toThrow(
        'The "serviceA" service has a dependency on the "missingDep" service. But the "missingDep" service was not registered.',
      );
    });

    it('does not throw on a missing optional dependency', () => {
      const container = new ServicesContainer();
      const service = {
        optionalDeps: { missingDep: true },
      };
      container.register('serviceA', service);
      expect(() => container.validate()).not.toThrow();
    });

    it('detects cyclic dependencies', () => {
      const container = new ServicesContainer();
      const serviceA = {
        deps: { serviceB: true },
      };
      const serviceB = {
        deps: { serviceA: true },
      };
      container.register('serviceA', serviceA);
      container.register('serviceB', serviceB);
      expect(() => container.validate()).toThrow('Cyclic dependency, node was:"serviceB"');
    });

    it('returns topological sort order', () => {
      const container = new ServicesContainer();
      const serviceA = {
        deps: { serviceA1: true, serviceA2: true },
      };
      const serviceA1 = {
        deps: { serviceB: true },
      };
      const serviceA2 = {
        deps: {},
      };
      const serviceB = {
        deps: {},
      };
      container.register('serviceA2', serviceA2);
      container.register('serviceA', serviceA);
      container.register('serviceA1', serviceA1);
      container.register('serviceB', serviceB);

      expect(container.validate()).toEqual(['serviceB', 'serviceA2', 'serviceA1', 'serviceA']);
    });

    it('returns topological sort order for optionals', () => {
      const container = new ServicesContainer();
      const serviceA = {
        optionalDeps: { serviceA1: true, serviceA2: true },
      };
      const serviceA1 = {
        optionalDeps: { serviceB: true },
      };
      const serviceA2 = {
        optionalDeps: {},
      };
      const serviceB = {
        optionalDeps: {},
      };
      container.register('serviceA2', serviceA2);
      container.register('serviceA', serviceA);
      container.register('serviceA1', serviceA1);
      container.register('serviceB', serviceB);

      expect(container.validate()).toEqual(['serviceB', 'serviceA2', 'serviceA1', 'serviceA']);
    });
  });
});
