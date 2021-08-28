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

const _ = require('lodash');

const { getIdToken } = require('@aws-ee/api-testing-framework');

const { createUser } = require('./complex/create-user');

class MissingStackOutputError extends Error {
  constructor(stackName, outputName) {
    const message = `No "${outputName}" output defined by stack "${stackName}"`;
    super(message);

    this.stackName = stackName;
    this.outputName = outputName;
  }
}

async function init({ settings, aws }) {
  const [cloudFormation, parameterStore, cognitoUserPools] = await Promise.all([
    aws.services.cloudFormation(),
    aws.services.parameterStore(),
    aws.services.cognitoUserPools(),
  ]);

  // There are a few settings that we need to derive and add to the settings
  const envName = settings.get('envName');
  const awsRegionShortName = settings.get('awsRegionShortName');
  const solutionName = settings.get('solutionName');

  const backendStackName = `${envName}-${awsRegionShortName}-${solutionName}-backend`;
  const webinfraStackName = `${envName}-${awsRegionShortName}-${solutionName}-webinfra`;

  settings.set('backendStackName', backendStackName);
  settings.set('webinfraStackName', webinfraStackName);

  // The api endpoint from CloudFormation if not local
  let apiEndpoint;
  let websiteUrl;

  // If isLocal = false, we get the api endpoint from the backend stack outputs
  if (settings.get('isLocal')) {
    apiEndpoint = settings.get('localApiEndpoint');
    websiteUrl = 'http://localhost';
  } else {
    apiEndpoint = await cloudFormation.getStackOutputValue(backendStackName, 'ServiceEndpoint');
    if (_.isEmpty(apiEndpoint)) throw new MissingStackOutputError(backendStackName, 'ServiceEndpoint');

    websiteUrl = await cloudFormation.getStackOutputValue(webinfraStackName, 'WebsiteUrl');
    if (_.isEmpty(websiteUrl)) throw new MissingStackOutputError(webinfraStackName, 'WebsiteUrl');
  }

  settings.set('apiEndpoint', apiEndpoint);
  settings.set('websiteUrl', websiteUrl);

  // Get Cognito user pool info from backend stack
  const userPoolId = await cloudFormation.getStackOutputValue(backendStackName, 'UserPoolId');
  if (_.isEmpty(userPoolId)) throw new MissingStackOutputError(backendStackName, 'UserPoolId');

  const appClientId = await cloudFormation.getStackOutputValue(backendStackName, 'ApiIntegrationTestAppClient');
  if (_.isEmpty(appClientId)) throw new MissingStackOutputError(backendStackName, 'ApiIntegrationTestAppClient');

  const awsRegion = settings.get('awsRegion');
  const authenticationProviderId = `https://cognito-idp.${awsRegion}.amazonaws.com/${userPoolId}`;

  settings.set('userPoolId', userPoolId);
  settings.set('appClientId', appClientId);
  settings.set('authenticationProviderId', authenticationProviderId);

  // Try to get the default test admin password from Parameter Store and ensure the user exists
  const adminEmail = settings.get('apiIntegrationTestAdminEmail');
  const paramStoreRoot = settings.get('paramStoreRoot');
  const adminPasswordParamKey = `${paramStoreRoot}/api-integration-tests/admin-password`;

  let adminPassword;
  try {
    adminPassword = _.first(
      await Promise.all([
        parameterStore.getParameter(adminPasswordParamKey),
        cognitoUserPools.getUser({ userPoolId, username: adminEmail }),
      ]),
    );
  } catch (error) {
    // Create the default test admin if it doesn't exist
    if (_.includes(['ParameterNotFound', 'UserNotFoundException'], _.get(error, 'code'))) {
      const adminUser = {
        email: adminEmail,
        firstName: 'API Integration',
        lastName: 'Test Admin',
        userRole: 'admin',
      };
      const createUserResult = await createUser({ aws, user: adminUser });

      // Store the new admin's password in Parameter Store
      adminPassword = createUserResult.password;
      await parameterStore.putParameter(adminPasswordParamKey, adminPassword, true);
    } else {
      throw new Error(`Failed to retrieve test admin details: ${_.get(error, 'message', error)}`);
    }
  }

  settings.set('password', adminPassword);

  // Get ID token for default admin
  const adminIdToken = await getIdToken({ aws, username: adminEmail, password: adminPassword });
  settings.set('adminIdToken', adminIdToken);
}

module.exports = { init };
