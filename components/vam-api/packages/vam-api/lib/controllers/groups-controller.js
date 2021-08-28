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

const logRequest = require('./util');
/**
 * Configures Group routes
 *
 * @param context - an instance of the AppContext defined in base-rest-api
 *
 * @openapi
 * components:
 *   schemas:
 *     listedGroup:
 *       type: object
 *       properties:
 *         cn:
 *           type: string
 *         dn:
 *           type: string
 */
async function configure(context) {
  const router = context.router();
  const wrap = context.wrap;

  /**
   * @openapi
   * paths:
   *   /api/groups:
   *     get:
   *       summary: List groups
   *       description: Get groups accessible to the logged-in user
   *       operationId: getGroups
   *       tags:
   *         - Groups
   *       responses:
   *         "200":
   *           description: List of groups
   *           content:
   *             "application/json":
   *               schema:
   *                 type: array
   *                 items:
   *                   $ref: "#/components/schemas/listedGroup"
   *         "400":
   *           $ref: "#/components/responses/InvalidInput"
   *         "403":
   *           $ref: "#/components/responses/Forbidden"
   *         "500":
   *           $ref: "#/components/responses/Internal"
   */
  router.get(
    '/',
    wrap(async (req, res) => {
      logRequest(req);
      const requestContext = res.locals.requestContext;
      const [groupService] = await context.service(['groupService']);
      const list = await groupService.list(requestContext);
      res.status(200).json(list);
    }),
  );

  return router;
}

export default configure;
