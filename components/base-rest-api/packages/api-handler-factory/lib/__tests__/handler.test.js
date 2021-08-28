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

/* eslint-disable max-classes-per-file */
import corsMock from 'cors';
import handlerFactory from '../handler';

class MockService {
  initService() {
    return Promise.resolve();
  }
}

class MockSettingsService extends MockService {
  constructor(settings) {
    super();
    this.settings = settings;
  }

  get(key) {
    return this.settings[key];
  }

  optional(key, defaultValue) {
    return this.get(key) || defaultValue;
  }

  optionalObject(key, defaultValue) {
    return this.get(key) || defaultValue;
  }
}

class MockLoggerService extends MockService {
  info() {}
}

function mockRegisterServices(settings) {
  return servicesContainer => {
    servicesContainer.register('settings', new MockSettingsService(settings));
    servicesContainer.register('log', new MockLoggerService());
  };
}

function mockRegisterRoutes() {}

const settings = {
  corsAllowList: ['corsDomainGlob1', 'corsDomainGlob2'],
  corsAllowListLocal: ['corsDomainLoc1', 'corsDomainLoc2'],
  supportedLanguages: '{"en":"en"}',
};

const mockRegisterI18n = jest.fn(() => {
  return { en: 'en' };
});

describe('handlerFactory', () => {
  let handler;

  describe('in dev mode', () => {
    beforeEach(() => {
      handler = handlerFactory({
        registerServices: mockRegisterServices({
          ...settings,
          envType: 'dev',
        }),
        registerRoutes: mockRegisterRoutes,
        registerI18n: mockRegisterI18n,
      });
    });

    it('does not thow', async () => {
      await expect(handler('ev', 'ctx')).resolves.toBe();
    });

    it('allows the correct cors domains', async () => {
      await expect(handler('ev', 'ctx')).resolves.toBe();
      expect(corsMock).toHaveBeenCalledTimes(1);
      const corsConfig = corsMock.mock.calls[0][0];

      corsConfig.origin('corsDomainGlob2', (_, allowed) => {
        expect(allowed).toBe(true);
      });
      corsConfig.origin('corsDomainLoc1', (_, allowed) => {
        expect(allowed).toBe(true);
      });
      corsConfig.origin('unknown', (_, allowed) => {
        expect(allowed).toBe(false);
      });
    });

    it('calls the registerI18n method', async () => {
      await expect(handler('ev', 'ctx')).resolves.toBe();
      expect(mockRegisterI18n).toHaveBeenCalledTimes(1);
    });
  });
});
