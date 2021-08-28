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

import {
  AwsService,
  DbService,
  S3Service,
  IamService,
  JsonSchemaValidationService,
  PluginRegistryService,
  AuditWriterService,
  AuthorizationService,
  UserAuthzService,
  UserRolesService,
  UserCapabilitiesService,
  UserService,
} from '@aws-ee/base-services';

import {
  AuthenticationService,
  AuthenticationProviderConfigService,
  AuthenticationProviderTypeService,
  JwtService,
  TokenRevocationService,
} from '@aws-ee/base-api-services';

const settingKeys = {
  tablePrefix: 'dbPrefix',
};

/**
 * A function that registers base services required by the base addon for api handler lambda function
 * @param container An instance of ServicesContainer to register services to
 * @param pluginRegistry A registry that provides plugins registered by various components for the specified extension point.
 *
 * @returns {Promise<void>}
 */
// eslint-disable-next-line no-unused-vars
async function registerServices(container, pluginRegistry) {
  container.register('aws', new AwsService());
  container.register('s3Service', new S3Service());
  container.register('iamService', new IamService());
  container.register('authenticationProviderConfigService', new AuthenticationProviderConfigService());
  container.register('authenticationProviderTypeService', new AuthenticationProviderTypeService());
  container.register('authenticationService', new AuthenticationService());
  container.register('tokenRevocationService', new TokenRevocationService());

  container.register('dbService', new DbService(), { lazy: false });
  container.register('jsonSchemaValidationService', new JsonSchemaValidationService());
  container.register('jwtService', new JwtService());
  container.register('userRolesService', new UserRolesService());
  container.register('userCapabilitiesService', new UserCapabilitiesService());
  container.register('userService', new UserService());
  container.register('auditWriterService', new AuditWriterService());
  container.register('pluginRegistryService', new PluginRegistryService(pluginRegistry), { lazy: false });

  // Authorization Services from base addon
  container.register('authorizationService', new AuthorizationService());
  container.register('userAuthzService', new UserAuthzService());
}

/**
 * A function that registers base static settings required by the base addon for api handler lambda function
 * @param existingStaticSettings
 * @param settings
 * @param pluginRegistry A registry that provides plugins registered by various components for the specified extension point.
 *
 * @returns {Promise<*>} A promise that resolves to static settings object
 */
// eslint-disable-next-line no-unused-vars
function getStaticSettings(existingStaticSettings, settings, pluginRegistry) {
  const staticSettings = {
    ...existingStaticSettings,
  };

  // Register all dynamodb table names used by the base rest api addon
  const tablePrefix = settings.get(settingKeys.tablePrefix);
  const table = (key, suffix) => {
    staticSettings[key] = `${tablePrefix}-${suffix}`;
  };
  table('dbAuthenticationProviderTypes', 'AuthenticationProviderTypes');
  table('dbAuthenticationProviderConfigs', 'AuthenticationProviderConfigs');
  table('dbRevokedTokens', 'RevokedTokens');
  table('dbUsers', 'Users');
  table('dbUserRoles', 'UserRoles');
  table('dbLocks', 'Locks');

  return staticSettings;
}

const plugin = {
  getStaticSettings,
  // getLoggingContext, // not implemented, the default behavior provided by base is sufficient
  // getLoggingContext, // not implemented, the default behavior provided by base is sufficient
  // registerSettingsService, // not implemented, the default behavior provided by base is sufficient
  // registerLoggerService, // not implemented, the default behavior provided by base is sufficient
  registerServices,
};
export default plugin;
