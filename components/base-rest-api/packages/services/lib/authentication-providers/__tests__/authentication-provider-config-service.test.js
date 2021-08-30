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
import DbServiceMock from '../../../__mocks__/db-service.mock';
import SettingsServiceMock from '../../../__mocks__/settings-service.mock';
import { authenticationProviders as authProviderConstants } from '../constants';
import AuthenticationProviderConfigService from '../authentication-provider-config-service';

const settings = {
  dbAuthenticationProviderConfigs: 'authProviderConfigs',
};

const providerConfig = {
  providerTypeConfig: {
    provider: 'config',
  },
  providerConfig: {
    id: 'testProvider',
  },
};

const expectedSavedConfiguration = {
  config: { id: providerConfig.providerConfig.id, type: providerConfig.providerTypeConfig },
  status: authProviderConstants.status.initializing,
};

describe('AuthenticationProviderConfigService', () => {
  let sut;
  let container;
  let db;
  let jsonSchemaValidationService;

  beforeEach(async done => {
    sut = new AuthenticationProviderConfigService();
    db = new DbServiceMock();
    jsonSchemaValidationService = { ensureValid: jest.fn().mockResolvedValue(true) };
    container = new ServicesContainerMock({
      sut,
      dbService: db,
      settings: new SettingsServiceMock(settings),
      log: {},
      jsonSchemaValidationService,
    });
    await container.initServices();
    done();
  });

  describe('.getAuthenticationProviderConfigs', () => {
    describe('with no configuration', () => {
      it('returns empty', async done => {
        const result = await sut.getAuthenticationProviderConfigs();
        expect(result).toEqual([]);
        done();
      });
    });

    describe('with configuration', () => {
      beforeEach(async done => {
        await sut.saveAuthenticationProviderConfig(providerConfig);
        done();
      });
      it('returns returns the correct configs', async done => {
        const result = await sut.getAuthenticationProviderConfigs();
        expect(result).toEqual([expectedSavedConfiguration]);
        done();
      });
    });
  });

  describe('.getAuthenticationProviderConfig', () => {
    describe('with no configuration', () => {
      it('returns empty', async done => {
        const result = await sut.getAuthenticationProviderConfig(providerConfig.providerConfig.id);
        expect(result).toBeUndefined();
        done();
      });
    });

    describe('with configuration', () => {
      beforeEach(async done => {
        await sut.saveAuthenticationProviderConfig(providerConfig);
        done();
      });

      it('returns empty on an unknown id', async done => {
        const result = await sut.getAuthenticationProviderConfig('unknownId');
        expect(result).toBeUndefined();
        done();
      });

      it('returns the expected config on the correct id', async done => {
        const result = await sut.getAuthenticationProviderConfig(providerConfig.providerConfig.id);
        expect(result).toEqual(expectedSavedConfiguration);
        done();
      });
    });
  });

  describe('.exists', () => {
    describe('with no configuration', () => {
      it('returns false', async done => {
        const result = await sut.exists(providerConfig.providerConfig.id);
        expect(result).toBe(false);
        done();
      });
    });

    describe('with configuration', () => {
      beforeEach(async done => {
        await sut.saveAuthenticationProviderConfig(providerConfig);
        done();
      });
      it('returns false on an unknown id', async done => {
        const result = await sut.exists('unknownId');
        expect(result).toBe(false);
        done();
      });

      it('returns true on the correct id', async done => {
        const result = await sut.exists(providerConfig.providerConfig.id);
        expect(result).toBe(true);
        done();
      });
    });
  });

  describe('.saveAuthenticationProviderConfig', () => {
    it('saves a valid config', async done => {
      const result = await sut.saveAuthenticationProviderConfig(providerConfig);
      expect(result).toEqual(expectedSavedConfiguration);
      done();
    });

    it('saves a valid config with status', async done => {
      const result = await sut.saveAuthenticationProviderConfig({
        ...providerConfig,
        status: authProviderConstants.status.active,
      });
      expect(result).toEqual({
        ...expectedSavedConfiguration,
        status: authProviderConstants.status.active,
      });
      done();
    });
  });
});
