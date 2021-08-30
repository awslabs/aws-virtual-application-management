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
 * Configures appstream-image-builders routes.
 *
 * @param context - an instance of AppContext defined in base-rest-api.
 *
 * @openapi
 * components:
 *  schemas:
 *    appstream-image-builder:
 *      type: object
 *      properties:
 *        name:
 *          type: string
 *        displayName:
 *          type: string
 */
async function configure(context) {
  const router = context.router();
  const wrap = context.wrap;

  /**
   * @openapi
   * paths:
   *  /api/appstream-image-builders:
   *    get:
   *      summary: List all appstream image builders
   *      description: List all appstream image builders
   *      operationId: getAppstreaImageBuilders
   *      tags:
   *        - Appstream Image Builders
   *      responses:
   *        "200":
   *          description: List of appstream image builders
   *          content:
   *            application/json:
   *              schema:
   *                type: array
   *                items:
   *                  $ref: "#/components/schemas/appstream-image-builder"
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
      const [appstreamService] = await context.service(['appstreamService']);
      const list = await appstreamService.listImageBuilders(requestContext);
      res.status(200).json(list);
    }),
  );

  return router;
}
module.exports = configure;
