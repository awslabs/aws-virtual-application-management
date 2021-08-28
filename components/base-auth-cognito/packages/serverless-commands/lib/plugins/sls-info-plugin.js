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

import { awsHelper } from '@aws-ee/base-script-utils';

async function paginatedFind(listingFn, predicate, pageToken) {
  const { list, nextPageToken } = await listingFn(pageToken);
  let found = _.find(list, predicate);
  // If no matching item found and if there are more pages then search through the next page
  if (_.isUndefined(found) && nextPageToken) {
    found = await paginatedFind(listingFn, predicate, nextPageToken);
  }
  return found;
}

// eslint-disable-next-line no-unused-vars
async function getInfo(existingInfo, slsPlugin, pluginRegistry) {
  const {
    envName,
    solutionName,
    awsRegion,
    awsProfile,
    namespace,
    cognitoUserPoolName,
  } = slsPlugin.serverless.service.custom.settings;

  const userPoolName = cognitoUserPoolName || namespace;

  const cognitoSdk = awsHelper.getClientSdk({ clientName: 'CognitoIdentityServiceProvider', awsProfile, awsRegion });

  const listingFn = async pageToken => {
    const result = await cognitoSdk.listUserPools({ MaxResults: '60', NextToken: pageToken }).promise();
    return { list: result.UserPools, nextPageToken: pageToken };
  };

  const foundUserPool = await paginatedFind(listingFn, userPool => userPool.Name === userPoolName);
  if (!foundUserPool) {
    slsPlugin.cli.warn(
      `
      
      WARNING: No Cognito UserPool found with Name = "${userPoolName}". 
      Have you deployed the solution? 
      If yes, make sure you have various IdP federation related settings "fedIdp*" specified and deploy again.
      `,
    );
    // If not user pool is found then there is nothing to add just return existing info as Map
    return new Map(existingInfo);
  }

  const userPoolId = foundUserPool.Id;
  const { Certificate: userPoolSigningCert } = await cognitoSdk
    .getSigningCertificate({
      UserPoolId: userPoolId,
    })
    .promise();

  const {
    UserPool: { Domain: domainNamePrefix },
  } = await cognitoSdk.describeUserPool({ UserPoolId: userPoolId }).promise();

  const relyingPartyId = `urn:amazon:cognito:sp:${userPoolId}`;
  const samlAssertionConsumerEndpoint = `https://${domainNamePrefix}.auth.${awsRegion}.amazoncognito.com/saml2/idpresponse`;
  const samlLogoutEndpoint = `https://${domainNamePrefix}.auth.${awsRegion}.amazoncognito.com/saml2/logout`;

  const info = new Map([
    ...existingInfo,
    ['userPoolId', { value: userPoolId, title: 'Cognito User Pool ID', display: true }],
    ['relyingPartyId', { value: relyingPartyId, title: 'Relying Party Id (Cognito User Pool URN)', display: true }],
    [
      'samlAssertionConsumerEndpoint',
      { value: samlAssertionConsumerEndpoint, title: '(Login) SAML Assertion Consumer Endpoint', display: true },
    ],
    ['samlLogoutEndpoint', { value: samlLogoutEndpoint, title: '(Logout) SAML Logout Endpoint', display: true }],
    // Hide cert in summary since it's too long to display in the resulting table
    ['userPoolSigningCert', { value: userPoolSigningCert, title: 'User Pool Signing Cert', display: false }],
    ['envName', { value: envName, title: 'Environment Name', display: true }],
    ['solutionName', { value: solutionName, title: 'Solution Name', display: true }],
  ]);
  return info;
}

const plugin = {
  info: getInfo,
};

export default plugin;
