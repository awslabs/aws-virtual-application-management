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

/**
 * This file contains a collection of methods to help with generating the authentication providers
 * configuration data for testing purposes.
 */

import _ from 'lodash';

const configurations = [
  {
    createdAt: '2020-02-14T22:34:22.185Z',
    id: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_poolId1',
    config: {
      title: 'Login using Active Directory',
      type: {
        type: 'cognito_user_pool',
        config: {
          credentialHandlingType: 'redirect',
        },
      },
      userPoolName: 'test-raas-userPool1',
      clientName: 'test-raas-client1',
      userPoolDomainPrefix: 'test-raas1',
      enableNativeUserPoolUsers: false,
      federatedIdentityProviders: [
        {
          id: 'datalake.example.com',
          name: 'DataLake',
          displayName: 'Login using Active Directory',
          metadata: 's3://1234567890-test-va-raas-artifacts/saml-metadata/datalake-demo-idp-metadata.xml',
        },
      ],
      userPoolId: 'us-east-1_poolId1',
      id: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_poolId1',
      clientId: '199999999991',
      signInUri:
        'https://test-raas1.auth.us-east-1.amazoncognito.com/oauth2/authorize?response_type=token&client_id=199999999991&redirect_uri=https://12345.cloudfront.net',
      signOutUri:
        'https://test-raas1.auth.us-east-1.amazoncognito.com/logout?client_id=199999999991&logout_uri=https://12345.cloudfront.net',
    },
    updatedAt: '2020-06-23T03:29:09.335Z',
    status: 'active',
  },
  {
    createdAt: '2020-02-14T22:34:23.509Z',
    id: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_poolId2',
    config: {
      title: 'Login using Active Directory 2',
      type: {
        type: 'cognito_user_pool',
        config: {
          credentialHandlingType: 'redirect',
        },
      },
      userPoolName: 'test-raas-userPool2',
      clientName: 'test-raas-client2',
      userPoolDomainPrefix: 'test-raas2',
      enableNativeUserPoolUsers: false,
      federatedIdentityProviders: [
        {
          id: 'datalake2.example.com',
          name: 'DataLake2',
          displayName: 'Login using Active Directory 2',
          metadata: 's3://1234567890-test-va-raas-artifacts/saml-metadata/datalake2-demo-idp-metadata.xml',
        },
      ],
      userPoolId: 'us-east-1_poolId2',
      id: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_poolId2',
      clientId: '28888888888882',
      signInUri:
        'https://test-raas2.auth.us-east-1.amazoncognito.com/login?response_type=token&client_id=28888888888882&redirect_uri=https://12345.cloudfront.net',
      signOutUri:
        'https://test-raas2.auth.us-east-1.amazoncognito.com/logout?client_id=28888888888882&logout_uri=https://12345.cloudfront.net',
    },
    updatedAt: '2020-02-14T22:34:23.509Z',
    status: 'active',
  },
  {
    config: {
      id: 'https://foo.bar.com',
      title: 'Non-Cognito Identity Provider',
      type: {
        type: 'custom_provider',
        config: {
          credentialHandlingType: 'redirect',
        },
      },
      credentialHandlingType: 'redirect',
      signInUri:
        'https://foo.bar.com/login?response_type=token&client_id=abcdefghijklmn&redirect_uri=https://12345.cloudfront.net',
      signOutUri: 'https://foo.bar.com/logout?client_id=abcdefghijklmn&logout_uri=https://12345.cloudfront.net',
    },
  },
];

const publicConfigurations = [
  {
    id: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_poolId1',
    title: 'Login using Active Directory',
    type: 'cognito_user_pool',
    credentialHandlingType: 'redirect',
    signInUri:
      'https://test-raas1.auth.us-east-1.amazoncognito.com/oauth2/authorize?response_type=token&client_id=199999999991&redirect_uri=https://12345.cloudfront.net',
    signOutUri:
      'https://test-raas1.auth.us-east-1.amazoncognito.com/logout?client_id=199999999991&logout_uri=https://12345.cloudfront.net',
  },
  {
    id: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_poolId2',
    title: 'Login using Active Directory 2',
    type: 'cognito_user_pool',
    credentialHandlingType: 'redirect',
    signInUri:
      'https://test-raas2.auth.us-east-1.amazoncognito.com/login?response_type=token&client_id=28888888888882&redirect_uri=https://12345.cloudfront.net',
    signOutUri:
      'https://test-raas2.auth.us-east-1.amazoncognito.com/logout?client_id=28888888888882&logout_uri=https://12345.cloudfront.net',
  },
  {
    id: 'https://foo.bar.com',
    title: 'Non-Cognito Identity Provider',
    type: 'custom_provider',
    credentialHandlingType: 'redirect',
    signInUri:
      'https://foo.bar.com/login?response_type=token&client_id=abcdefghijklmn&redirect_uri=https://12345.cloudfront.net',
    signOutUri: 'https://foo.bar.com/logout?client_id=abcdefghijklmn&logout_uri=https://12345.cloudfront.net',
  },
];

const configs = {
  getConfigurations: () => _.cloneDeep(configurations),
  getPublicConfigurations: () => _.cloneDeep(publicConfigurations),
};

export default configs;
