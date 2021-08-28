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

import { authenticationProviders as authProviderConstants } from '@aws-ee/base-api-services';
import { getSystemRequestContext } from '@aws-ee/base-services';
import { Boom } from '@aws-ee/base-services-container';

const settingKeys = {
  awsRegion: 'awsRegion',
  userPoolId: 'userPoolId',
  userPoolClientId: 'userPoolClientId',
  userPoolDomainPrefix: 'userPoolDomainPrefix',
  enableNativeUserPoolUsers: 'enableNativeUserPoolUsers',
  fedIdpIds: 'fedIdpIds',
  fedIdpNames: 'fedIdpNames',
  fedIdpDisplayNames: 'fedIdpDisplayNames',
  fedIdpMetadatas: 'fedIdpMetadatas',
  cognitoAuthNProviderTitle: 'cognitoAuthNProviderTitle',
  websiteUrl: 'websiteUrl',
  adminPrincipals: 'adminPrincipals',
};
const boom = new Boom();

/**
 * @param {Object} param0
 * @param {Object} param0.requestContext The RequestContext object containing principal (caller) information.
 * @param {Object} param0.container An instance of ServicesContainer
 * @param {string[]} param0.typesSoFar The authentication providers types which have already been registered
 *
 * @typedef {Object} ProviderTypes
 * @property {string[]} types An array of authentication provider types to register
 *
 * @returns {Object} A new list of auth provider types to register after being updated by the plugin
 */
// eslint-disable-next-line no-unused-vars
async function registerProviderTypes({ requestContext, container, typesSoFar }) {
  const cognitoProvisionerService = await container.find('cognitoProvisionerService');
  return { types: [...typesSoFar, cognitoProvisionerService.providerType] };
}

/**
 * Performs any remaining steps necessary for the authentication provider to be used by the solution such as the
 * creation of resources, additional configuration steps, and the creation of initial admin users
 * @param {Object} container An instance of ServicesContainer
 */
async function provisionProvider(container) {
  const log = await container.find('log');
  const settings = await container.find('settings');

  // Get settings
  const enableNativeUserPoolUsers = settings.getBoolean(settingKeys.enableNativeUserPoolUsers);

  const fedIdpIds = settings.optionalObject(settingKeys.fedIdpIds, []);
  const fedIdpNames = settings.optionalObject(settingKeys.fedIdpNames, []);
  const fedIdpDisplayNames = settings.optionalObject(settingKeys.fedIdpDisplayNames, []);
  const fedIdpMetadatas = settings.optionalObject(settingKeys.fedIdpMetadatas, []);

  // If user pools aren't enabled and no IdPs are configured, skip user pool creation
  const idpsNotConfigured = [fedIdpIds, fedIdpNames, fedIdpDisplayNames, fedIdpMetadatas].some(
    array => array.length === 0,
  );
  if (!enableNativeUserPoolUsers && idpsNotConfigured) {
    log.info('Cognito user pool not enabled in settings; skipping creation');
    return;
  }

  // Construct base auth provider config
  const federatedIdentityProviders = await Promise.all(
    fedIdpIds.map(async (idpId, idx) => {
      return {
        id: idpId,
        name: fedIdpNames[idx],
        displayName: fedIdpDisplayNames[idx],
        metadata: fedIdpMetadatas[idx],
      };
    }),
  );

  const cognitoAuthProviderConfig = {
    title: settings.get(settingKeys.cognitoAuthNProviderTitle),
    userPoolId: settings.get(settingKeys.userPoolId),
    clientId: settings.get(settingKeys.userPoolClientId),
    userPoolDomainPrefix: settings.get(settingKeys.userPoolDomainPrefix),
    enableNativeUserPoolUsers,
    federatedIdentityProviders,
    websiteUrl: settings.get(settingKeys.websiteUrl),
  };

  // Retrieve auth provider type config
  const cognitoProvisionerService = await container.find('cognitoProvisionerService');

  // Verify that the stored auth provider config also exists
  const awsRegion = settings.get(settingKeys.awsRegion);
  const authProviderId = `https://cognito-idp.${awsRegion}.amazonaws.com/${cognitoAuthProviderConfig.userPoolId}`;

  const authenticationProviderConfigService = await container.find('authenticationProviderConfigService');
  const authProviderExists = !!(await authenticationProviderConfigService.getAuthenticationProviderConfig(
    authProviderId,
  ));

  if (authProviderExists) {
    cognitoAuthProviderConfig.id = authProviderId;
  }

  // Update user pool
  const action = authProviderExists
    ? authProviderConstants.provisioningAction.update
    : authProviderConstants.provisioningAction.create;

  const provisionPoolResult = await cognitoProvisionerService.provision({
    providerConfig: cognitoAuthProviderConfig,
    action,
  });

  // Create initial admin users in pool
  log.info('Creating configured admin users');

  const adminPrincipals = settings.getObject(settingKeys.adminPrincipals);
  const users = _.map(adminPrincipals, principal => ({
    ...principal,
    userRole: 'admin',
    status: 'active',
  }));

  const userService = await container.find('userService');
  try {
    await userService.createUsers(getSystemRequestContext(), users, provisionPoolResult.config.id);
  } catch (bulkErrors) {
    const realErrorMsgs = [];
    const errorMsgs = _.get(bulkErrors, 'payload');
    if (_.isArray(errorMsgs)) {
      _.forEach(errorMsgs, errorMsg => {
        if (errorMsg.endsWith(userService.userExistsErrorMsg)) {
          log.warn(errorMsg);
        } else {
          realErrorMsgs.push(errorMsg);
        }
      });
    }

    if (!_.isEmpty(realErrorMsgs)) {
      throw boom.internalError('Error(s) encountered creating admin users').withPayload({ errors: realErrorMsgs });
    }
  }
}

/**
 * Performs any steps necessary to clean up the authentication provider so that no resources are orphaned whe the
 * solution is torn down
 * @param {Object} container An instance of ServicesContainer
 */
// eslint-disable-next-line no-unused-vars
async function teardownProvider(container) {
  // NOOP since the user pool is managed via the assembly override CloudFormation assets and removal of the pool
  // tears down child resources as well
}

const authenticationProvisionerPlugin = { registerProviderTypes, provisionProvider, teardownProvider };

export default authenticationProvisionerPlugin;
