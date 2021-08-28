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
import AuthenticationProviderTypeService from '../authentication-provider-type-service';

class PluginRegistryService {
  constructor(plugins = {}) {
    this.plugins = plugins;
  }

  async visitPlugins(extensionPoint, methodName, { payload }) {
    if (this.plugins[extensionPoint] && this.plugins[extensionPoint][methodName]) {
      return this.plugins[extensionPoint][methodName](payload);
    }
    return payload;
  }
}

describe('AuthenticationProviderConfigService', () => {
  let sut;
  let container;
  let mockAuthorizationService;

  beforeEach(async done => {
    mockAuthorizationService = {
      assertAuthorized: jest.fn(payload => payload),
    };
    sut = new AuthenticationProviderTypeService();
    container = new ServicesContainerMock({
      sut,
      authorizationService: mockAuthorizationService,
      pluginRegistryService: new PluginRegistryService(),
    });
    await container.initServices();
    done();
  });

  describe('.getAuthenticationProviderTypes', () => {
    it('returns the built-in providers', async done => {
      const result = await sut.getAuthenticationProviderTypes();
      expect(result).toEqual([]);
      done();
    });
  });

  describe('.getAuthenticationProviderType', () => {
    it('returns undefined for an invalid id', async done => {
      const result = await sut.getAuthenticationProviderType(undefined, 'invalid');
      expect(result).toBeUndefined();
      done();
    });
  });
});
