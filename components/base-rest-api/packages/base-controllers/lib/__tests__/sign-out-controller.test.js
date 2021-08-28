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
import controller from '../sign-out-controller';

describe('sign-out-controller', () => {
  let context;
  let authenticationProviderConfigService;
  let mockTokenRevoker;
  let router;
  beforeEach(async done => {
    authenticationProviderConfigService = {
      getAuthenticationProviderConfig: jest.fn(),
    };
    mockTokenRevoker = {
      revokeToken: jest.fn(),
    };
    context = createContext({
      authenticationProviderConfigService,
      mockTokenRevoker,
    });
    router = await controller(context);
    done();
  });

  describe('POST /', () => {
    itProp('throws when no locator is given', [fc.string()], async authenticationProviderId => {
      const response = {
        locals: {
          authenticationProviderId,
        },
      };
      try {
        await router.invoke('POST', '/', undefined, response);
      } catch (err) {
        expect(err.message).toBe(
          `Error logging out. The authentication provider with id = '${authenticationProviderId}' does not support token revocation`,
        );
        expect(err.status).toBe(400);
        expect(err.safe).toBe(false);
        return;
      }
      throw new Error('Expected an exception');
    });

    itProp(
      'successfully revokes the token',
      [fc.string(), fc.string(), fc.object()],
      async (authenticationProviderId, token, requestContext) => {
        const mockProviderConfig = {
          config: {
            type: {
              config: {
                impl: {
                  tokenRevokerLocator: 'locator:service:mockTokenRevoker/revokeToken',
                },
              },
            },
          },
        };
        authenticationProviderConfigService.getAuthenticationProviderConfig.mockResolvedValue(mockProviderConfig);
        mockTokenRevoker.revokeToken.mockResolvedValue();

        const response = {
          locals: { authenticationProviderId, token, requestContext },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };

        await router.invoke('POST', '/', undefined, response);

        expect(authenticationProviderConfigService.getAuthenticationProviderConfig).toHaveBeenCalledWith(
          response.locals.authenticationProviderId,
        );
        expect(mockTokenRevoker.revokeToken).toHaveBeenCalledWith(
          response.locals.requestContext,
          {
            token: response.locals.token,
          },
          mockProviderConfig,
        );
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith({ revoked: true });
      },
    );
  });
});
