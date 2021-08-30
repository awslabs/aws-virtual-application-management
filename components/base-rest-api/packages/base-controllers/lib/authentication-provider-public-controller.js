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

/**
 * Configures API routes
 *
 * @param context - an instance of the AppContext defined in base-rest-api
 */
async function configure(context) {
  const router = context.router();
  const wrap = context.wrap;
  // const settings = context.settings;
  // const boom = context.boom;

  const authenticationProviderConfigService = await context.service('authenticationProviderConfigService');

  /**
   * @openapi
   * paths:
   *   /api/authentication/public/provider/configs:
   *     get:
   *       summary: List public authentication provider configs
   *       description: Lists the public authentication provider configurations
   *       operationId: listPublicAuthenticationProviderConfigs
   *       tags:
   *         - Authentication Providers
   *       responses:
   *         "200":
   *           description: Authentication provider configurations
   */
  router.get(
    '/',
    wrap(async (req, res) => {
      const providers = await authenticationProviderConfigService.getAuthenticationProviderConfigs();

      // Construct/filter results based on info that's needed client-side
      const visibleProviders = _.filter(providers, provider => _.get(provider, 'config.type.visible', true));

      // Serialized provider configs
      const serializedProviderConfigs = _.map(visibleProviders, provider => ({
        id: provider.config.id,
        title: provider.config.title,
        type: provider.config.type.type,
        credentialHandlingType: provider.config.type.config.credentialHandlingType,
        signInUri: provider.config.signInUri,
        signOutUri: provider.config.signOutUri,
      }));

      res.status(200).json(serializedProviderConfigs);
    }),
  );

  return router;
}

export default configure;
