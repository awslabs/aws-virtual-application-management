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

async function init({ settings, aws }) {
  // There are a few settings that we need to derive and add to the settings
  const envName = settings.get('envName');
  const awsRegionShortName = settings.get('awsRegionShortName');
  const solutionName = settings.get('solutionName');
  const backendStackName = `${envName}-${awsRegionShortName}-${solutionName}-backend`;
  const webinfraStackName = `${envName}-${awsRegionShortName}-${solutionName}-webinfra`;

  settings.set('backendStackName', backendStackName);
  settings.set('webinfraStackName', webinfraStackName);

  // The api endpoint from cloudformation if not local
  let apiEndpoint;
  let websiteUrl;

  // If isLocal = false, we get the api endpoint from the backend stack outputs
  if (settings.get('isLocal')) {
    apiEndpoint = settings.get('localApiEndpoint');
    websiteUrl = 'http://localhost';
  } else {
    const cloudformation = await aws.services.cloudFormation();
    apiEndpoint = await cloudformation.getStackOutputValue(backendStackName, 'ServiceEndpoint');
    if (_.isEmpty(apiEndpoint)) throw new Error(`No API Endpoint value defined in stack ${backendStackName}`);

    websiteUrl = await cloudformation.getStackOutputValue(webinfraStackName, 'WebsiteUrl');
    if (_.isEmpty(websiteUrl)) throw new Error(`No WebsiteUrl value defined in stack ${webinfraStackName}`);
  }

  settings.set('apiEndpoint', apiEndpoint);
  settings.set('websiteUrl', websiteUrl);

  // Get the admin password from parameter store
  const ssm = await aws.services.parameterStore();
  const passwordPath = settings.get('passwordPath');
  const password = await ssm.getParameter(passwordPath);

  const adminIdToken = await getIdToken({
    username: settings.get('username'),
    password,
    apiEndpoint,
    authenticationProviderId: settings.get('authenticationProviderId'),
  });

  settings.set('password', password);
  settings.set('adminIdToken', adminIdToken);
}

module.exports = { init };
