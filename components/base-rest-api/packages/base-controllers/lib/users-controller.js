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
 *   parameters:
 *     userId:
 *       name: uid
 *       required: true
 *       in: path
 *       description: User id
 *       schema:
 *         type: string
 */
async function configure(context) {
  const router = context.router();
  const wrap = context.wrap;
  const userService = await context.service('userService');

  /**
   * @openapi
   * paths:
   *   /api/users:
   *     get:
   *       summary: List users
   *       description: Lists users
   *       operationId: listUsers
   *       tags:
   *         - Users
   *       responses:
   *         "200":
   *           description: Users
   *         "500":
   *           $ref: "#/components/responses/Internal"
   */
  router.get(
    '/',
    wrap(async (req, res) => {
      const requestContext = res.locals.requestContext;
      const { maxResults, nextToken } = req.query;
      const users = await userService.listUsers(requestContext, { maxResults, nextToken });
      res.status(200).json(users);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/users:
   *     post:
   *       summary: Create user
   *       description: Creates user
   *       operationId: createUser
   *       requestBody:
   *         required: true
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/createUser"
   *       tags:
   *         - Users
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/User"
   *         "400":
   *           $ref: "#/components/responses/InvalidInput"
   *         "403":
   *           $ref: "#/components/responses/Forbidden"
   *         "500":
   *           $ref: "#/components/responses/Internal"
   */
  router.post(
    '/',
    wrap(async (req, res) => {
      const requestContext = res.locals.requestContext;
      const createdUser = await userService.createUser(requestContext, req.body);
      res.status(200).json(createdUser);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/users/bulk:
   *     post:
   *       summary: Create users
   *       description: Creates users
   *       operationId: createUsers
   *       requestBody:
   *         required: true
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: "#/components/schemas/createUser"
   *       tags:
   *         - Users
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/User"
   *         "400":
   *           $ref: "#/components/responses/InvalidInput"
   *         "403":
   *           $ref: "#/components/responses/Forbidden"
   *         "500":
   *           $ref: "#/components/responses/Internal"
   */
  router.post(
    '/bulk',
    wrap(async (req, res) => {
      const requestContext = res.locals.requestContext;
      const users = req.body;
      const defaultAuthNProviderId = req.query.authenticationProviderId;
      const result = await userService.createUsers(requestContext, users, defaultAuthNProviderId);
      res.status(200).json(result);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/users/{uid}:
   *     put:
   *       summary: Update user
   *       description: Updates the user with specified id
   *       operationId: updateUser
   *       parameters:
   *         - $ref: "#/components/parameters/userId"
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
    '/:uid',
    wrap(async (req, res) => {
      const requestContext = res.locals.requestContext;
      const uid = req.params.uid;
      const userInBody = req.body || {};
      const user = await userService.updateUser(requestContext, {
        ...userInBody,
        uid,
      });
      res.status(200).json(user);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/users/{uid}:
   *     delete:
   *       summary: Delete user
   *       description: Deletes the user with specified id
   *       operationId: deleteUser
   *       parameters:
   *         - $ref: "#/components/parameters/userId"
   *       tags:
   *         - Users
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/Success"
   *         "403":
   *           $ref: "#/components/responses/Forbidden"
   *         "404":
   *           $ref: "#/components/responses/NotFound"
   */
  router.delete(
    '/:uid',
    wrap(async (req, res) => {
      const requestContext = res.locals.requestContext;
      const { uid } = req.params;
      const { authenticationProviderId, identityProviderName } = req.body;
      await userService.deleteUser(requestContext, {
        uid,
        authenticationProviderId,
        identityProviderName,
      });
      res.status(200).json({ message: `user ${uid} deleted` });
    }),
  );

  return router;
}

export default configure;
