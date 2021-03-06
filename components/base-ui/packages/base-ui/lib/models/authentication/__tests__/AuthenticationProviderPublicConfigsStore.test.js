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

import { AuthenticationProviderPublicConfigsStore } from '../AuthenticationProviderPublicConfigsStore';
import { registerContextItems as registerAuthentication } from '../Authentication';
import { getAuthenticationProviderPublicConfigs } from '../../../helpers/api';

jest.mock('../../../helpers/api');

const publicConfigurations = [
  {
    id: 'internal',
    title: 'Default Login',
    type: 'internal',
    credentialHandlingType: 'submit',
    signInUri: 'api/authentication/id-tokens',
    signOutUri: 'api/authentication/logout',
  },
  {
    id: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_poolId1',
    title: 'Login using Active Directory',
    type: 'cognito_user_pool',
    credentialHandlingType: 'redirect',
    signOutUri:
      'https://test-raas1.auth.us-east-1.amazoncognito.com/logout?client_id=199999999991&logout_uri=https://12345.cloudfront.net',
    signInUri:
      'https://test-raas1.auth.us-east-1.amazoncognito.com/oauth2/authorize?response_type=token&client_id=199999999991&redirect_uri=https://12345.cloudfront.net&identity_provider=COGNITO',
  },
  {
    id: 'datalake.example.com',
    title: 'Login using Active Directory',
    type: 'cognito_user_pool_federated_idp',
    credentialHandlingType: 'redirect',
    signInUri:
      'https://test-raas1.auth.us-east-1.amazoncognito.com/oauth2/authorize?response_type=token&client_id=199999999991&redirect_uri=https://12345.cloudfront.net&idp_identifier=datalake.example.com',
    signOutUri:
      'https://test-raas1.auth.us-east-1.amazoncognito.com/logout?client_id=199999999991&logout_uri=https://12345.cloudfront.net',
  },
  {
    id: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_poolId2',
    title: 'Login using Active Directory 2',
    type: 'cognito_user_pool',
    credentialHandlingType: 'redirect',
    signOutUri:
      'https://test-raas2.auth.us-east-1.amazoncognito.com/logout?client_id=28888888888882&logout_uri=https://12345.cloudfront.net',
    signInUri:
      'https://test-raas2.auth.us-east-1.amazoncognito.com/login?response_type=token&client_id=28888888888882&redirect_uri=https://12345.cloudfront.net&identity_provider=COGNITO',
  },
  {
    id: 'datalake2.example.com',
    title: 'Login using Active Directory 2',
    type: 'cognito_user_pool_federated_idp',
    credentialHandlingType: 'redirect',
    signInUri:
      'https://test-raas2.auth.us-east-1.amazoncognito.com/login?response_type=token&client_id=28888888888882&redirect_uri=https://12345.cloudfront.net&idp_identifier=datalake2.example.com',
    signOutUri:
      'https://test-raas2.auth.us-east-1.amazoncognito.com/logout?client_id=28888888888882&logout_uri=https://12345.cloudfront.net',
  },
];

describe('AuthenticationProviderPublicConfigsStore', () => {
  describe('authenticationProviderOptions', () => {
    it('should return config options', async () => {
      const appContext = {};

      // Lets register the authentication store because it is a dependency
      registerAuthentication(appContext);

      // Make the api call return the test data
      getAuthenticationProviderPublicConfigs.mockResolvedValue(_.cloneDeep(publicConfigurations));

      // Create the store and trigger the loading
      const store = AuthenticationProviderPublicConfigsStore.create({}, appContext);
      await store.load();

      // Get the provider options
      const options = store.authenticationProviderOptions;

      // Lets see if the api is called
      expect(getAuthenticationProviderPublicConfigs).toHaveBeenCalled();

      // Check if the returned options are as expected
      expect(options).toEqual([
        { key: 'internal', text: 'Default Login', value: 'internal' },
        {
          key: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_poolId1',
          text: 'Login using Active Directory',
          value: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_poolId1',
        },
        {
          key: 'datalake.example.com',
          text: 'Login using Active Directory',
          value: 'datalake.example.com',
        },
        {
          key: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_poolId2',
          text: 'Login using Active Directory 2',
          value: 'https://cognito-idp.us-east-1.amazonaws.com/us-east-1_poolId2',
        },
        {
          key: 'datalake2.example.com',
          text: 'Login using Active Directory 2',
          value: 'datalake2.example.com',
        },
      ]);
    });
  });
});
