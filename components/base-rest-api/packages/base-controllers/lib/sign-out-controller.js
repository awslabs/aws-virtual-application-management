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

import { newInvoker } from '@aws-ee/base-api-services';

/**
 * Configures API routes
 *
 * @param context - an instance of the AppContext defined in base-rest-api
 */
async function configure(context) {
  const router = context.router();
  const wrap = context.wrap;
  // const settings = context.settings;
  const boom = context.boom;

  const providerConfigService = await context.service('authenticationProviderConfigService');
  const invoke = newInvoker(context.service.bind(context));

  /**
   * @openapi
   * paths:
   *   /api/authentication/logout:
   *     post:
   *       summary: Sign out
   *       description: Signs out
   *       operationId: signOut
   *       tags:
   *         - Authentication
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/Success"
   *         "400":
   *           $ref: "#/components/responses/InvalidInput"
   *         "500":
   *           $ref: "#/components/responses/Internal"
   */
  router.post(
    '/',
    wrap(async (req, res) => {
      const providerId = res.locals.authenticationProviderId;
      const token = res.locals.token;
      const requestContext = res.locals.requestContext;

      const providerConfig = await providerConfigService.getAuthenticationProviderConfig(providerId);
      const tokenRevokerLocator = _.get(providerConfig, 'config.type.config.impl.tokenRevokerLocator');
      if (!tokenRevokerLocator) {
        throw boom.badRequest(
          `Error logging out. The authentication provider with id = '${providerId}' does not support token revocation`,
          false,
        );
      }

      // invoke the token revoker and pass the token that needs to be revoked
      await invoke(tokenRevokerLocator, requestContext, { token }, providerConfig);
      res.status(200).json({ revoked: true });
    }),
  );

  return router;
}

export default configure;
