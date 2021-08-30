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

import _ from 'lodash';

import { Service } from '@aws-ee/base-services-container';
import { getSystemRequestContext } from '@aws-ee/base-services';

import cognitoProviderConfig from './metadata/provider-config';
import { getCognitoTokenVerifier } from './helpers/cognito-token-verifier';

class CognitoProviderService extends Service {
  constructor() {
    super();
    this.dependency(['userService', 'cognitoAttributeMapperService', 'tokenRevocationService']);
    this.cognitoTokenVerifiersCache = {}; // Cache object containing token verifier objects. Each token verifier is keyed by the userPoolUri
  }

  get providerConfig() {
    return cognitoProviderConfig;
  }

  // eslint-disable-next-line no-unused-vars
  async validateToken({ token, issuer }, providerConfig) {
    if (_.isEmpty(token)) {
      throw this.boom.forbidden('no jwt token was provided', true);
    }
    // -- Check if this token is revoked (may be due to an earlier logout)
    const tokenRevocationService = await this.service('tokenRevocationService');
    const isRevoked = await tokenRevocationService.isRevoked({ token });
    if (isRevoked) {
      throw this.boom.invalidToken('The token is revoked', true);
    }

    // In case of cognito, the issuer is the cognito userPoolUri
    const userPoolUri = issuer;
    let cognitoTokenVerifier = this.cognitoTokenVerifiersCache[userPoolUri];
    if (!cognitoTokenVerifier) {
      // No cognitoTokenVerifier in the cache so create a new one
      cognitoTokenVerifier = await getCognitoTokenVerifier(userPoolUri, this.log);
      // Add newly created cognitoTokenVerifier to the cache
      this.cognitoTokenVerifiersCache[userPoolUri] = cognitoTokenVerifier;
    }

    // Use the cognitoTokenVerifier to validate cognito token
    const verifiedToken = await cognitoTokenVerifier.verify(token);

    // Map user attributes from claims in the token
    const cognitoAttributeMapperService = await this.service('cognitoAttributeMapperService');
    const userAttributes = await cognitoAttributeMapperService.mapAttributes(verifiedToken);

    // Get UID and update user details (if needed)
    let uid;
    if (userAttributes.isSamlAuthenticatedUser) {
      // For SAML-authenticated users, update the user record based on current token details
      uid = await this.saveUser(userAttributes, providerConfig.config.id);
    } else {
      uid = userAttributes.username; // Cognito sets this to a UUID when email is used as the primary way to authenticate
    }

    // Return user attributes
    const { username, identityProviderName } = userAttributes;
    return { verifiedToken, username, identityProviderName, uid };
  }

  async saveUser(userAttributes, authenticationProviderId) {
    // If this user is authenticated via SAML then we need to add it to our user table if it doesn't exist already
    const userService = await this.service('userService');

    const user = await userService.findUserByPrincipal({
      username: userAttributes.username,
      authenticationProviderId,
      identityProviderName: userAttributes.identityProviderName,
    });

    let uid;
    if (user) {
      await this.updateUser(authenticationProviderId, userAttributes, user);
      uid = user.uid;
    } else {
      const createdUser = await this.createUser(authenticationProviderId, userAttributes);
      uid = createdUser.uid;
    }
    return uid;
  }

  /**
   * Creates a user in the system based on the user attributes provided by the SAML Identity Provider (IdP)
   * @param authenticationProviderId ID of the authentication provider
   * @param userAttributes An object containing attributes mapped from SAML IdP
   * @returns {Promise<void>}
   */
  async createUser(authenticationProviderId, userAttributes) {
    const userService = await this.service('userService');
    try {
      return userService.createUser(getSystemRequestContext(), {
        authenticationProviderId,
        ...userAttributes,
      });
    } catch (err) {
      this.log.error(err);
      throw this.boom.internalError('error creating user');
    }
  }

  /**
   * Updates user in the system based on the user attributes provided by the SAML Identity Provider (IdP).
   * This base implementation updates only those user attributes in the system which are missing but are available in
   * the SAML user attributes. Subclasses can override this method to provide different implementation (for example,
   * update all user attributes in the system if they are updated in SAML IdP etc)
   *
   * @param authenticationProviderId ID of the authentication provider
   * @param userAttributes An object containing attributes mapped from SAML IdP
   * @param existingUser The existing user in the system
   *
   * @returns {Promise<void>}
   */
  async updateUser(authenticationProviderId, userAttributes, existingUser) {
    // Find all attributes present in the userAttributes but missing in existingUser
    const missingAttribs = {};
    const keys = _.keys(userAttributes);
    if (!_.isEmpty(keys)) {
      _.forEach(keys, key => {
        const value = userAttributes[key];
        const existingValue = existingUser[key];

        // check if the attribute is missing in the existingUser object but present in
        // userAttributes (i.e., the user attributes mapped from SAML assertions)
        if (_.isNil(existingValue)) {
          missingAttribs[key] = value;
        }
      });
    }

    // If there are any attributes that are present in the userAttributes but missing in existingUser
    // then update the user in the system to set the missing attributes
    if (!_.isEmpty(missingAttribs)) {
      const userService = await this.service('userService');
      const { uid, rev } = existingUser;
      try {
        await userService.updateUser(getSystemRequestContext(), {
          uid,
          rev,
          ...missingAttribs,
        });
      } catch (err) {
        this.log.error(err);
        throw this.boom.internalError('error updating user');
      }
    }
  }

  // eslint-disable-next-line no-unused-vars
  async revokeToken(requestContext, { token }, providerConfig) {
    const tokenRevocationService = await this.service('tokenRevocationService');
    await tokenRevocationService.revoke(requestContext, { token });
  }
}

export default CognitoProviderService;
