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
 * Function to remove impl information from authentication provider config or authentication provider type configuration as that is not useful on the client side \
 * and should not be transmitted
 *
 * @param authConfigOrTypeConfig Authentication provider config or authentication provider type configuration
 * @returns {{impl}}
 */
const sanitize = authConfigOrTypeConfig => {
  const sanitizeOne = config => {
    if (_.get(config, 'config.impl')) {
      // When the auth provider type config is passed the impl is at 'config.impl' path
      delete config.config.impl;
    } else if (_.get(config, 'type.config.impl')) {
      // When the auth provider config is passed the impl is at 'type.config.impl' path
      delete config.type.config.impl;
    }
    return config;
  };
  return _.isArray(authConfigOrTypeConfig)
    ? _.map(authConfigOrTypeConfig, sanitizeOne)
    : sanitizeOne(authConfigOrTypeConfig);
};

/**
 * Configures API routes
 *
 * @param context - an instance of the AppContext defined in base-rest-api
 * @openapi
 * components:
 *   requestBodies:
 *     providerTypeConfig:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - providerTypeId
 *               - providerConfig
 *             properties:
 *               providerTypeId:
 *                 type: string
 *                 description: Authentication provider type id
 *               providerConfig:
 *                 type: object
 *                 description: Authentication provider configuration
 *                 required:
 *                 - id
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: Authentication provider configuration id
 */
async function configure(context) {
  const router = context.router();
  const wrap = context.wrap;
  const [authenticationProviderConfigService] = await context.service(['authenticationProviderConfigService']);

  /**
   * @openapi
   * paths:
   *   /api/authentication/provider/configs:
   *     get:
   *       summary: List authentication provider configs
   *       description: Lists the authentication provider configurations
   *       operationId: listAuthenticationProviderConfigs
   *       tags:
   *         - Authentication Providers
   *       responses:
   *         "200":
   *           description: Authentication provider configurations
   */
  router.get(
    '/configs',
    wrap(async (req, res) => {
      const result = await authenticationProviderConfigService.getAuthenticationProviderConfigs();
      res.status(200).json(sanitize(result));
    }),
  );

  return router;
}

export default configure;
