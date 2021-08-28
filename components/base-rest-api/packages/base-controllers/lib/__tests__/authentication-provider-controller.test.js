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

import createContext from '../../__mocks__/context.mock';
import controller from '../authentication-provider-controller';

describe('authentication-provider-controller', () => {
  let context;
  let authenticationProviderTypeService;
  let authenticationProviderConfigService;
  let mockProvisioner;
  let router;
  beforeEach(async done => {
    authenticationProviderTypeService = {
      getAuthenticationProviderType: jest.fn(),
      getAuthenticationProviderTypes: jest.fn(),
    };
    authenticationProviderConfigService = {
      getAuthenticationProviderConfigs: jest.fn(),
    };
    mockProvisioner = {
      provision: jest.fn(),
    };
    context = createContext({
      authenticationProviderTypeService,
      authenticationProviderConfigService,
      mockProvisioner,
    });
    router = await controller(context);
    done();
  });

  describe('GET /configs', () => {
    itProp('calls the correct service method', [fc.object()], async mockConfigs => {
      authenticationProviderConfigService.getAuthenticationProviderConfigs.mockResolvedValue(mockConfigs);
      const request = {};
      const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      await router.invoke('GET', '/configs', request, response);
      expect(authenticationProviderConfigService.getAuthenticationProviderConfigs).toHaveBeenCalled();
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(mockConfigs);
    });

    it.each`
      input                                           | output
      ${{ config: { impl: 'test value' } }}           | ${{ config: {} }}
      ${{ type: { config: { impl: 'test value' } } }} | ${{ type: { config: {} } }}
    `('removes config values from $input', async ({ input, output }, done) => {
      const mockConfigs = {
        mock: 'configs',
        ...input,
      };
      const expectedSanitisedResult = { mock: 'configs', ...output };
      authenticationProviderConfigService.getAuthenticationProviderConfigs.mockResolvedValue(mockConfigs);
      const request = {};
      const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      await router.invoke('GET', '/configs', request, response);
      expect(response.json).toHaveBeenCalledWith(expectedSanitisedResult);
      done();
    });
  });
});
