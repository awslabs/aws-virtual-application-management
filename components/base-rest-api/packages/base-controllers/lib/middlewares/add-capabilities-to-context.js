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

async function configure(context) {
  const router = context.router();
  const wrap = context.wrap;
  const userRolesService = await context.service('userRolesService');

  // ===============================================================
  //  A middleware
  // ===============================================================
  // populate user capabilities to the requestContext principal
  router.all(
    '*',
    wrap(async (req, res, next) => {
      const requestContext = res.locals.requestContext;
      const userRole = requestContext.principal.userRole;
      const { capabilities: capabilityIds } =
        (await userRolesService.mustFind(requestContext, {
          id: userRole,
          fields: ['capabilities'],
        })) || {};
      requestContext.principal.capabilityIds = capabilityIds;
      return next();
    }),
  );

  return router;
}

export default configure;
