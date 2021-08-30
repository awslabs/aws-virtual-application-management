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

import ServicesContainerMock from '../../../__mocks__/services-container.mock';
import ServicesPlugin from '../services-plugin';

const mockSettings = s => ({ get: key => s[key] });

describe('ServicesPlugin', () => {
  describe('.registerServices', () => {
    it('registers all required services', () => {
      const container = new ServicesContainerMock();
      ServicesPlugin.registerServices(container);

      expect(Object.keys(container.serviceMap)).toEqual([
        'aws',
        'authenticationProviderConfigService',
        'authenticationProviderTypeService',
        'dbService',
        'jsonSchemaValidationService',
        'inputManifestValidationService',
        'jwtService',
        'userRolesService',
        'userCapabilitiesService',
        'userService',
        's3Service',
        'iamService',
        'lockService',
        'tokenRevocationService',
        'auditWriterService',
        'pluginRegistryService',
        'permissionService',
        'authorizationService',
        'userAuthzService',
      ]);
    });
  });

  describe('.getStaticSettings', () => {
    it('returns the correct output', () => {
      const settings = mockSettings({ dbPrefix: 'mockPrefix' });
      const result = ServicesPlugin.getStaticSettings(undefined, settings);
      expect(result).toEqual({
        dbAuthenticationProviderTypes: 'mockPrefix-AuthenticationProviderTypes',
        dbAuthenticationProviderConfigs: 'mockPrefix-AuthenticationProviderConfigs',
        dbRevokedTokens: 'mockPrefix-RevokedTokens',
        dbUsers: 'mockPrefix-Users',
        dbUserRoles: 'mockPrefix-UserRoles',
        dbLocks: 'mockPrefix-Locks',
        dbPermissions: 'mockPrefix-Permissions',
      });
    });
  });
});
