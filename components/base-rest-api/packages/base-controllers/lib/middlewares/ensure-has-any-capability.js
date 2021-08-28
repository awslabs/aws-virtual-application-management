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

import { allowIfHasAnyCapability, isDeny } from '@aws-ee/base-services';

async function configure(context, capabilityIds) {
  const router = context.router();
  const wrap = context.wrap;
  const boom = context.boom;
  // ===============================================================
  //  A middleware
  // ===============================================================
  // Ensure the current user (principal) has any of the required capabilities
  router.all(
    '*',
    wrap(async (req, res, next) => {
      const requestContext = res.locals.requestContext;
      const permission = await allowIfHasAnyCapability(requestContext, { action: '*' }, capabilityIds);

      if (isDeny(permission)) {
        throw boom.forbidden('You are not authorized to perform this operation', true);
      }
      next();
    }),
  );

  return router;
}

/**
 * Returns a middleware configuration function.
 * The returned function creates a middleware that checks if the given principal has any of the specified capabilities.
 *
 * The middleware assumes that the "requestContext.principal.capabilityIds" is populated correctly.
 * The "requestContext.principal.capabilityIds" can be added by the "add-capabilities-to-context" middleware to the route.
 *
 * The middleware throws unauthorized error if the principal does not have any capability specified in the capabilityIds argument.
 *
 * @param capabilityIds
 */
function factoryFn(capabilityIds) {
  return context => configure(context, capabilityIds);
}

export default factoryFn;
