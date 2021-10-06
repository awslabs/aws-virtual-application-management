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

import {
  UserService,
  UserRolesService,
  AuthorizationService,
  UserAuthzService,
  AuditWriterService,
} from '@aws-ee/base-services';
import DbServiceMock from '../../__mocks__/db-service.mock';

import ServicesContainerMock from '../../__mocks__/services-container.mock';
import SettingsServiceMock from '../../__mocks__/settings-service.mock';
import AuthenticationService from '../authentication-service';
import TokenSwapperService from '../token-swapper-service';

jest.mock('@aws-ee/base-services');

const settings = {
  dbValidTokens: 'dbValidTokens',
};

const validatorMockResponse = {
  verifiedToken: 'validatorToken',
  uid: 'validatorUid',
  username: 'validatorUsername',
  identityProviderName: 'validatorIDP',
};

const validJWTToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwidXNlcm5hbWUiOiJNb2NrVXNlciIsImlhdCI6MTUxNjIzOTAyMiwiaXNzIjoiTW9ja0F1dGhQcm92aWRlciIsImN1c3RvbTphdXRoZW50aWNhdGlvblByb3ZpZGVySWQiOiJNb2NrUHJvdmlkZXJJZCIsImN1c3RvbTppZGVudGl0eVByb3ZpZGVyTmFtZSI6Ik1vY2tQcm92aWRlck5hbWUiLCJleHAiOjF9.RVW2FgZxn0PUdfohvKmCDCzqgzhzYnd1_8ez3Scaw6c';

const validationLocator = 'locator:service:validatorServiceMock/validate';
const revokerLocator = 'locator:service:revokerServiceMock/revoke';

describe('AuthenticationService', () => {
  let sut;
  let container;
  let authenticationProviderConfigService;
  let apiKeyService;
  let dbService;
  let auditWriterService;
  let authorizationService;
  let userAuthzService;
  let userService;
  let userRolesService;
  let logger;
  let tokenSwapperService;

  beforeEach(async done => {
    sut = new AuthenticationService();
    sut.logger = logger;
    authenticationProviderConfigService = { getAuthenticationProviderConfig: jest.fn() };
    apiKeyService = {
      isApiKeyToken: jest.fn().mockResolvedValue(false),
      validateApiKey: jest.fn().mockRejectedValue('Invalid api key'),
    };

    dbService = new DbServiceMock();
    auditWriterService = new AuditWriterService();
    authorizationService = new AuthorizationService();
    userAuthzService = new UserAuthzService();
    userService = new UserService();
    userRolesService = new UserRolesService();
    tokenSwapperService = new TokenSwapperService();
    logger = { error: jest.fn() };

    container = new ServicesContainerMock({
      sut,
      pluginRegistryService: { visitPlugins: jest.fn() },
      authenticationProviderConfigService,
      apiKeyService,
      validatorServiceMock: { validate: jest.fn().mockReturnValue(validatorMockResponse) },
      revokerServiceMock: { revoke: jest.fn().mockReturnValue(true) },
      dbService,
      auditWriterService,
      authorizationService,
      userAuthzService,
      userService,
      userRolesService,
      tokenSwapperService,
      settings: new SettingsServiceMock(settings),
      log: logger,
    });
    await container.initServices();
    done();
  });

  describe('.authenticateMain', () => {
    it('fails with empty token', async done => {
      const result = await sut.authenticate();
      expect(result).toEqual({ error: 'empty token', authenticated: false });
      done();
    });

    it('fails with invalid token', async done => {
      const result = await sut.authenticate('invalid token');
      expect(result.authenticated).toBe(false);
      expect(result.error.includes('InvalidTokenError')).toBe(true);
      done();
    });

    describe('when no provider config is given', () => {
      it('fails with an error', async done => {
        const result = await sut.authenticate(validJWTToken);
        expect(result).toEqual({
          uid: '1234567890',
          username: 'MockUser',
          authenticationProviderId: 'MockAuthProvider',
          error: "unknown provider id: 'MockAuthProvider'",
          authenticated: false,
        });
        done();
      });
    });

    describe('when valid provider config is given', () => {
      beforeEach(() => {
        authenticationProviderConfigService.getAuthenticationProviderConfig.mockReturnValue({
          config: {
            type: {
              config: { impl: { tokenValidatorLocator: validationLocator, tokenRevokerLocator: revokerLocator } },
            },
          },
        });
        userService.mustFindUser.mockReturnValueOnce({ uid: 'mockUid', userRole: 'admin' });
        userRolesService.mustFind.mockReturnValueOnce({ id: 'admin' });
      });

      it('succeeds', async done => {
        const result = await sut.authenticate(validJWTToken);
        expect(result).toEqual({
          authenticationProviderId: 'MockAuthProvider',
          authenticated: true,
          token: validJWTToken,
          ...validatorMockResponse,
        });
        done();
      });
    });
  });
});
