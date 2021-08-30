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

import controller from '../authentication-provider-public-controller';
import configurationsHelper from './__fixtures__/authentication-provider-configs';

// A function to help create a context that the controller is expecting
const createContext = serviceMap => ({
  router: () => ({
    routes: {},
    get(route, fn) {
      this.routes[route] = fn;
    },
  }),
  service: name => serviceMap[name],
  wrap(fn) {
    return async (req, res, next) => {
      try {
        await fn(req, res, next);
      } catch (err) {
        next(err);
      }
    };
  },
});

describe('AuthenticationProviderPublicController', () => {
  describe('get public provider configs', () => {
    it('should return all providers, serialized by plugins', async () => {
      const mockRawProviderConfigs = configurationsHelper.getConfigurations();
      const configService = { getAuthenticationProviderConfigs: () => mockRawProviderConfigs };

      const context = createContext({ authenticationProviderConfigService: configService });
      const router = await controller(context);

      // Did the controller register the '/' route?
      const route = router.routes['/'];
      expect(route).toBeDefined();

      const response = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      const next = jest.fn();
      await route({}, response, next);

      // The 'next' function should not have been called, otherwise it means that
      // the route had an error
      expect(next).not.toHaveBeenCalled();

      // Expecting a status of 200
      expect(response.status).toHaveBeenCalledWith(200);

      // Expecting a specific list of configurations
      const expectedOutput = configurationsHelper.getPublicConfigurations();
      expect(response.json).toHaveBeenCalledWith(expectedOutput);
    });
  });
});
