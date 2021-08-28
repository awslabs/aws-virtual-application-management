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
 * Configures appstream-applications route.
 *
 * @param context - an instance of AppContext defined in base-rest-api.
 *
 * @openapi
 * components:
 *  schemas:
 *    application:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *        repoType:
 *          type: string
 *        displayName:
 *          type: string
 *        name:
 *          type: string
 *        version:
 *          type: string
 *        iconUrl:
 *          type: string
 *        preinstalled:
 *          type: boolean
 */
async function configure(context) {
  const router = context.router();
  const wrap = context.wrap;
  /**
   * @openapi
   * paths:
   *  /api/appstream-applications:
   *    get:
   *      summary: List all appstream applications
   *      description: List all appstream applications
   *      operationId: getAppstreamApplications
   *      tags:
   *        - Appstream Applications
   *      responses:
   *        "200":
   *          description: List of appstream applications
   *          content:
   *            application/json:
   *              schema:
   *                type: array
   *                items:
   *                  $ref: "#/components/schemas/application"
   *        "400":
   *          $ref: "#/components/responses/InvalidInput"
   *        "403":
   *          $ref: "#/components/responses/Forbidden"
   *        "500":
   *          $ref: "#/components/responses/Internal"
   */
  router.get(
    '/',
    wrap(async (req, res) => {
      logRequest(req);
      const requestContext = res.locals.requestContext;
      const [appstreamUtilService] = await context.service(['appstreamUtilService']);
      const list = await appstreamUtilService.listApplications(requestContext);
      res.status(200).json(list);
    }),
  );

  return router;
}
module.exports = configure;
