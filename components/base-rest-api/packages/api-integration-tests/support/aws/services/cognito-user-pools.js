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

const crypto = require('crypto');
const _ = require('lodash');

const passwordGenerator = require('generate-password');

class CognitoUserPools {
  constructor({ aws, sdk }) {
    this.aws = aws;
    this.sdk = sdk;
  }

  async createUser({ userPoolId, user: { email, firstName, lastName, username = null } }) {
    // Create a new, random password for the user
    const password = passwordGenerator.generate({ length: 20, numbers: true, symbols: true, strict: true });

    // Create user in Cognito
    let createUserResp;
    try {
      createUserResp = await this.sdk
        .adminCreateUser({
          UserPoolId: userPoolId,
          Username: _.isNil(username) ? email : username,
          TemporaryPassword: password,
          MessageAction: 'SUPPRESS', // Don't send invite email with temp password to new user
          UserAttributes: [
            {
              Name: 'email',
              Value: email,
            },
            {
              Name: 'given_name',
              Value: firstName,
            },
            {
              Name: 'family_name',
              Value: lastName,
            },
          ],
        })
        .promise();
    } catch (error) {
      throw new Error(`Error encountered creating user with email "${email}": ${_.get(error, 'message', error)}`);
    }
    const userId = _.get(createUserResp, 'User.Username');

    return { userId, password };
  }

  async getUser({ userPoolId, username }) {
    return this.sdk.adminGetUser({ UserPoolId: userPoolId, Username: username }).promise();
  }

  async deleteUser({ userPoolId, username }) {
    try {
      await this.sdk
        .adminDeleteUser({
          UserPoolId: userPoolId,
          Username: username,
        })
        .promise();
    } catch (error) {
      throw new Error(`Error encountered deleting user with username "${username}": ${_.get(error, 'message', error)}`);
    }
  }

  async authenticate({ userPoolId, appClientId, username, password }) {
    // Get app client secret
    const describeClientResp = await this.sdk
      .describeUserPoolClient({ UserPoolId: userPoolId, ClientId: appClientId })
      .promise();
    const appClientSecret = _.get(describeClientResp, 'UserPoolClient.ClientSecret');

    // Build secret hash from app client secret
    const message = Buffer.from(username + appClientId, 'utf-8');
    const key = Buffer.from(appClientSecret, 'utf-8');
    const secretHash = crypto
      .createHmac('sha256', key)
      .update(message)
      .digest('base64');

    // Authenticate user
    let authResponse;
    try {
      authResponse = await this.sdk
        .adminInitiateAuth({
          AuthFlow: 'ADMIN_NO_SRP_AUTH',
          UserPoolId: userPoolId,
          ClientId: appClientId,
          AuthParameters: {
            USERNAME: username,
            PASSWORD: password,
            SECRET_HASH: secretHash,
          },
        })
        .promise();

      // If this is the first time the user has authenticated, respond to NEW_PASSWORD_REQUIRED request by "resetting"
      // the password to the same password already used
      if (_.get(authResponse, 'ChallengeName') === 'NEW_PASSWORD_REQUIRED') {
        authResponse = await this.sdk
          .adminRespondToAuthChallenge({
            ChallengeName: 'NEW_PASSWORD_REQUIRED',
            UserPoolId: userPoolId,
            ClientId: appClientId,
            ChallengeResponses: {
              USERNAME: username,
              NEW_PASSWORD: password,
              SECRET_HASH: secretHash,
            },
            Session: authResponse.Session,
          })
          .promise();
      }
    } catch (error) {
      throw new Error(`Failed to authenticate user "${username}": ${_.get(error, 'message', error)}`);
    }

    // Confirm we actually got an ID token from the authentication process
    const idToken = _.get(authResponse, 'AuthenticationResult.IdToken');
    if (_.isNil(idToken)) {
      throw new Error(`Failed to get ID token for user "${username}"`);
    }

    return idToken;
  }
}

// The aws javascript sdk client name
CognitoUserPools.clientName = 'CognitoIdentityServiceProvider';

// The framework is expecting this method. This is how the framework registers your aws services.
async function registerServices({ registry }) {
  registry.set('cognitoUserPools', CognitoUserPools);
}

module.exports = { registerServices };
