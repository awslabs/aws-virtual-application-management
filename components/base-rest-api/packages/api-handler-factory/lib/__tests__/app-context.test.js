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

import AppContext from '../app-context';

const mockServices = { service1: { mock: 'service' } };

describe('AppContext', () => {
  let appContext;
  beforeEach(() => {
    const mockContainer = {
      async find(name) {
        return mockServices[name];
      },
    };
    appContext = new AppContext({ servicesContainer: mockContainer });
  });

  describe('.service', () => {
    it('throws on blank', async () => {
      await expect(appContext.service()).rejects.toThrow('The "undefined" service is not available.');
    });

    it('throws on unknown', async () => {
      await expect(appContext.service('mystery')).rejects.toThrow('The "mystery" service is not available.');
    });

    it('throws on unknown (array version)', async () => {
      await expect(appContext.service(['mystery'])).rejects.toThrow('The "mystery" service is not available.');
    });

    it('returns empty on an empty array', async () => {
      await expect(appContext.service([])).resolves.toEqual([]);
    });

    it('returns the correct service in single value mode', async () => {
      await expect(appContext.service('service1')).resolves.toEqual(mockServices.service1);
    });

    it('returns the correct service in array mode', async () => {
      await expect(appContext.service(['service1'])).resolves.toEqual([mockServices.service1]);
    });
  });

  describe('.optionalService', () => {
    it('reacts gracefully to blank', async () => {
      await expect(appContext.optionalService()).resolves.toBeUndefined();
    });

    it('reacts gracefully to unknown', async () => {
      await expect(appContext.optionalService('mystery')).resolves.toBeUndefined();
    });

    it('reacts gracefully to unknown (array version)', async () => {
      await expect(appContext.optionalService(['mystery'])).resolves.toEqual([undefined]);
    });

    it('reacts gracefully to partial unknown', async () => {
      await expect(appContext.optionalService(['mystery', 'service1'])).resolves.toEqual([
        undefined,
        mockServices.service1,
      ]);
    });

    it('returns empty on an empty array', async () => {
      await expect(appContext.optionalService([])).resolves.toEqual([]);
    });

    it('returns the correct service in single value mode', async () => {
      await expect(appContext.service('service1')).resolves.toEqual(mockServices.service1);
    });

    it('returns the correct service in array mode', async () => {
      await expect(appContext.optionalService(['service1'])).resolves.toEqual([mockServices.service1]);
    });
  });

  describe('.wrap', () => {
    it('calls the passed function with the given params', async () => {
      expect.assertions(2);
      const wrappedFn = jest.fn(() => Promise.resolve());
      await appContext.wrap(wrappedFn)('req', 'res', 'next');
      expect(wrappedFn).toHaveBeenCalledTimes(1);
      expect(wrappedFn).toHaveBeenCalledWith('req', 'res', 'next');
    });

    it('does not propagate errors and calls next', async () => {
      expect.assertions(3);
      const err = 'No way';
      const wrappedFn = jest.fn(() => Promise.reject(err));
      const nextFn = jest.fn();
      await expect(appContext.wrap(wrappedFn)('req', 'res', nextFn)).resolves.toEqual();
      expect(nextFn).toHaveBeenCalledTimes(1);
      expect(nextFn).toHaveBeenCalledWith(err);
    });
  });

  describe('.router', () => {
    it('returns a router with mergeParams set to true', () => {
      const router = appContext.router();
      expect(router.mergeParams).toBe(true);
    });
  });
});
