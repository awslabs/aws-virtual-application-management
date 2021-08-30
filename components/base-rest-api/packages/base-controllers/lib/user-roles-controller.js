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
 * Configures API routes
 *
 * @param context - an instance of the AppContext defined in base-rest-api
 */
async function configure(context) {
  const router = context.router();
  const wrap = context.wrap;

  const [userRolesService] = await context.service(['userRolesService']);

  /**
   * @openapi
   * paths:
   *   /api/user-roles:
   *     get:
   *       summary: List user roles
   *       description: Lists the user roles
   *       operationId: listUserRoles
   *       tags:
   *         - User Roles
   *       responses:
   *         "200":
   *           description: User roles
   *         "500":
   *           $ref: "#/components/responses/Internal"
   */
  router.get(
    '/',
    wrap(async (_req, res) => {
      const requestContext = res.locals.requestContext;
      const userRoles = await userRolesService.list(requestContext);
      res.status(200).json(userRoles);
    }),
  );

  return router;
}

export default configure;
