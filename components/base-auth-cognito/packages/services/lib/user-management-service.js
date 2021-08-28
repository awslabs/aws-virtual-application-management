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

import { getUserPoolIdFromAuthProviderId, userRecordToCognitoAttrs } from './helpers/utils';

class CognitoUserManagementService extends Service {
  constructor() {
    super();
    this.dependency(['aws', 'userService']);
  }

  async createUser(userSoFar) {
    const user = { ...userSoFar };

    // If the user's auth provider is a Cognito user pool, create the user in the pool
    const userPoolId = getUserPoolIdFromAuthProviderId(user.authenticationProviderId);
    if (!_.isNil(userPoolId)) {
      // If the user is federated via a SAML IdP, skip user creation since Cognito handles this on login
      if (_.get(user, 'isSamlAuthenticatedUser', false)) {
        return user;
      }

      // Create native user pool user
      const aws = await this.service('aws');
      const cognitoUserPoolApis = new aws.sdk.CognitoIdentityServiceProvider();

      const createUserParams = {
        UserPoolId: userPoolId,
        Username: user.email,
        UserAttributes: userRecordToCognitoAttrs(user),
      };
      if (_.has(user, 'temporaryPassword')) {
        createUserParams.TemporaryPassword = user.temporaryPassword;
        createUserParams.MessageAction = 'SUPPRESS'; // Since a temp password was explicitly requested, don't email it
      }

      let createUserResult;
      try {
        createUserResult = await cognitoUserPoolApis.adminCreateUser(createUserParams).promise();
      } catch (clientError) {
        // In cases where a Cognito user pool is configured to use email addresses as the primary username, the user's
        // email is passed as their username during creation but the username created in the pool is a UUID. As a
        // result the userService's call to getUserByPrincipal() may not find the user and an additional check is
        // check is needed here.
        if (_.get(clientError, 'code') === 'UsernameExistsException') {
          const userService = await this.service('userService');
          throw this.boom.alreadyExists(userService.userExistsErrorMsg, true);
        }
        throw this.boom.internalError('Error creating user in Cognito user pool').withPayload({ clientError });
      }

      user.username = user.email;
      user.identityProviderName = `Cognito (${userPoolId})`;
      user.uid = createUserResult.User.Username; // Cognito sets this to a UUID when email is used as the primary way to authenticate
    }

    return user;
  }

  async updateUser(userUpdatesSoFar, existingUser) {
    const userUpdates = { ...userUpdatesSoFar };

    // Check whether the user's auth provider is a Cognito user pool and whether the user is *not*
    // authenticated via SAML since Cognito should automatically handle IdP-initiated updates
    const userPoolId = getUserPoolIdFromAuthProviderId(existingUser.authenticationProviderId);
    if (!_.isNil(userPoolId) && !_.get(existingUser, 'isSamlAuthenticatedUser', false)) {
      const baseCognitoParams = { UserPoolId: userPoolId, Username: existingUser.username };

      // Get existing and requested user attributes
      const aws = await this.service('aws');
      const cognitoUserPoolApis = new aws.sdk.CognitoIdentityServiceProvider();
      const existingCognitoUser = await cognitoUserPoolApis.adminGetUser(baseCognitoParams).promise();
      const existingCognitoAttrs = _.get(existingCognitoUser, 'UserAttributes');

      const newCognitoAttrs = userRecordToCognitoAttrs(userUpdatesSoFar);

      // Compare existing and requested user attributes to see whether any update is actually needed
      // TODO: Add support for deleting attributes without requiring every attribute to be passed on an update request
      const updatedAttributes = [];
      _.forEach(newCognitoAttrs, newCognitoAttr => {
        const existingAttr = _.find(existingCognitoAttrs, { Name: newCognitoAttr.Name });
        if (newCognitoAttr.Value !== _.get(existingAttr, 'Value')) {
          updatedAttributes.push(newCognitoAttr);
        }
      });

      // Update user in Cognito if necessary
      if (!_.isEmpty(updatedAttributes)) {
        await cognitoUserPoolApis
          .adminUpdateUserAttributes({ ...baseCognitoParams, UserAttributes: updatedAttributes })
          .promise();
      }
    }

    return userUpdates;
  }

  async deleteUser(user) {
    // Check whether the user's auth provider is a Cognito user pool
    const userPoolId = getUserPoolIdFromAuthProviderId(user.authenticationProviderId);
    if (!_.isNil(userPoolId)) {
      const deleteParams = { UserPoolId: userPoolId, Username: user.username };

      // If the user is federated via a SAML IdP, construct their Cognito username by combining IdP name + username
      // TODO: Simplify/Harden this logic along with the logic in cognitoAttributeMapperService
      if (_.get(user, 'isSamlAuthenticatedUser', false)) {
        const idpNameLower = user.identityProviderName.toLowerCase();
        const userId = user.username.replace('_', '\\');
        deleteParams.Username = `${idpNameLower}_${userId}`;
      }

      const aws = await this.service('aws');
      const cognitoUserPoolApis = new aws.sdk.CognitoIdentityServiceProvider();
      await cognitoUserPoolApis.adminDeleteUser(deleteParams).promise();
    }
  }
}

export default CognitoUserManagementService;
