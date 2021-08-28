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
 *
 * @openapi
 * components:
 *   responses:
 *     User:
 *       description: User
 */
async function configure(context) {
  const router = context.router();
  const wrap = context.wrap;
  const [userService] = await context.service(['userService']);

  /**
   * @openapi
   * paths:
   *   /api/user:
   *     get:
   *       summary: Get user
   *       description: Gets the user
   *       operationId: getUser
   *       tags:
   *         - Users
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/User"
   */
  router.get(
    '/',
    wrap(async (req, res) => {
      const user = res.locals.requestContext.principal;
      res.status(200).json(user);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/user:
   *     put:
   *       summary: Update current user
   *       description: Updates the current user; used for self-service update
   *       operationId: updateCurrentUser
   *       requestBody:
   *         required: true
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/updateUser"
   *       tags:
   *         - Users
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/User"
   *         "400":
   *           $ref: "#/components/responses/InvalidInput"
   *         "403":
   *           $ref: "#/components/responses/Forbidden"
   *         "404":
   *           $ref: "#/components/responses/NotFound"
   *         "409":
   *           $ref: "#/components/responses/Outdated"
   */
  router.put(
    '/',
    wrap(async (req, res) => {
      const requestContext = res.locals.requestContext;
      const currentUser = requestContext.principal;
      // Get current user's attributes to identify the user in the system
      const { uid } = currentUser;
      const userToUpdate = req.body;
      const updatedUser = await userService.updateUser(requestContext, {
        ...userToUpdate,
        uid,
      });
      res.status(200).json(updatedUser);
    }),
  );

  return router;
}

export default configure;
