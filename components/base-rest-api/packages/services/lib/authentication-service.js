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

import jwtDecode from 'jwt-decode';
import _ from 'lodash';

import { Service } from '@aws-ee/base-services-container';
import { getSystemRequestContext } from '@aws-ee/base-services';

import { newInvoker } from './authentication-providers/helpers/invoker';

const notAuthenticated = claims => ({ ...claims, authenticated: false });
const authenticated = claims => ({ ...claims, authenticated: true });

class AuthenticationService extends Service {
  constructor() {
    super();
    this.dependency(['authenticationProviderConfigService', 'pluginRegistryService', 'tokenSwapperService']);
  }

  async init() {
    this.invoke = newInvoker(this.container.find.bind(this.container));
    this.pluginRegistryService = await this.service('pluginRegistryService');
  }

  /**
   * type AuthenticationResult = AuthenticationSuccess | AuthenticationFailed;
   * type AuthenticationSuccess = {
   *   authenticated: true
   *   verifiedToken: Object
   *   uid: string
   *   username: string
   *   authenticationProviderId: string
   *   identityProviderName?: string
   * }
   * type AuthenticationError = {
   *   authenticated: false
   *   error: Error | string
   *   uid?: string
   *   username?: string
   *   authenticationProviderId?: string
   *   identityProviderName?: string
   * }
   *
   * @returns AuthenticationResult
   */
  // TODO return username even if authentication fails.
  async authenticateMain(token) {
    const authenticationProviderConfigService = await this.service('authenticationProviderConfigService');
    if (!token) {
      return notAuthenticated({ error: 'empty token' });
    }
    let claims;
    try {
      claims = jwtDecode(token);
    } catch (error) {
      return notAuthenticated({
        error: `jwt decode error: ${error.toString()}`,
      });
    }

    const providerId = claims.iss;
    const providerConfig = await authenticationProviderConfigService.getAuthenticationProviderConfig(providerId);
    if (!providerConfig) {
      return notAuthenticated({
        uid: claims.sub,
        username: claims.username,
        authenticationProviderId: claims.iss,
        error: `unknown provider id: '${providerId}'`,
      });
    }
    let tokenValidatorLocator;

    try {
      tokenValidatorLocator = providerConfig.config.type.config.impl.tokenValidatorLocator;
      // eslint-disable-next-line no-unused-vars
      const tokenRevokerLocator = providerConfig.config.type.config.impl.tokenRevokerLocator;
    } catch (error) {
      // exceptional circumstance, throw an actual error
      throw new Error(`malformed provider config for provider id '${providerId}'`);
    }
    try {
      const { verifiedToken, uid, username, identityProviderName } = await this.invoke(
        tokenValidatorLocator,
        { token, issuer: claims.iss },
        providerConfig,
      );
      const tokenSwapperService = await this.service('tokenSwapperService');
      await tokenSwapperService.swap({
        token,
        uid,
      });
      return authenticated({
        token,
        verifiedToken,
        uid,
        username,
        identityProviderName,
        authenticationProviderId: providerId,
      });
    } catch (error) {
      return notAuthenticated({
        uid: claims.sub,
        username: claims.username,
        authenticationProviderId: claims.iss,
        error,
      });
    }
  }

  async authenticate(token) {
    const originalAuthResult = await this.authenticateMain(token);

    const programmaticAccessProviders = await this.getProgrammaticAccessProvidersFromPlugins();

    // If the credentials are for an programmatic access provider. Check the AuthN plugins and return early.
    if (
      _.isObject(programmaticAccessProviders) &&
      Object.keys(programmaticAccessProviders).includes(originalAuthResult.authenticationProviderId)
    ) {
      return this.checkWithPlugins(token, originalAuthResult);
    }

    // Otherwise, assume that we're authenticating a user. As such we need to check the user's role
    const userRoleAuthResult = await this.checkUserRoles(token, originalAuthResult);

    // Give all plugins a chance to customize the authentication result
    return this.checkWithPlugins(token, userRoleAuthResult);
  }

  async checkUserRoles(_token, authResult) {
    const isAuthenticated = _.get(authResult, 'authenticated', false);

    // if the current authentication decision is "not authenticated" then return right away
    if (!isAuthenticated) return authResult;

    const logger = await this.container.find('log');
    try {
      const { uid, authenticationProviderId, identityProviderName } = authResult;
      const userService = await this.container.find('userService');
      const user = await userService.mustFindUser({
        uid,
        authenticationProviderId,
        identityProviderName,
      });

      const userRoleId = _.get(user, 'userRole');
      if (!userRoleId) {
        // no user role, don't know what kind of user is this, return not authenticated
        return notAuthenticated({ ...authResult });
      }

      const userRolesService = await this.container.find('userRolesService');
      // Make sure the user's role exists
      // It is possible that the user was created before with some role and then that role was deleted.
      // User's with those deleted roles should no longer be able to login.
      await userRolesService.mustFind(getSystemRequestContext(), { id: userRoleId });
    } catch (e) {
      logger.error('Error authenticating the user');
      logger.error(e);
      return notAuthenticated({ ...authResult });
    }

    return authResult;
  }

  async checkWithPlugins(token, authResult) {
    // Give all plugins a chance to customize the authentication result
    // This gives plugins registered to 'authentication' a chance to participate in the token
    // validation/authentication process
    const result = await this.pluginRegistryService.visitPlugins('authentication', 'authenticate', {
      payload: { token, container: this.container, authResult },
    });
    const effectiveAuthResult = _.get(result, 'authResult', authResult);
    return effectiveAuthResult;
  }

  async getProgrammaticAccessProvidersFromPlugins() {
    // Get the list of authentication providers that do not authenticate users in the solution (e.g. environments)
    const result = await this.pluginRegistryService.visitPlugins(
      'authentication-provider-type',
      'registerProgrammaticAccessProvider',
      {
        payload: { authProviderMapSoFar: {} },
      },
    );

    return result;
  }
}

export default AuthenticationService;
