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
 * Configure metrics routes.
 *
 * @param context - an instance of AppContext defined in base-rest-api.
 *
 * @openapi
 * components:
 *  schemas:
 *    metrics:
 *      type: object
 *      properties:
 *        name:
 *          type: string
 *        content:
 *          type: string
 */
async function configure(context) {
  const router = context.router();
  const wrap = context.wrap;

  /**
   * @openapi
   * paths:
   *  /api/metrics:
   *    get:
   *      summary: Get metrics
   *      description: Retrieve the metrics that have been reported
   *      operationId: getMetrics
   *      tags:
   *        - Metrics
   *      responses:
   *        "200":
   *          description: Get reported metrics
   *          content:
   *            application/json:
   *              schema:
   *                $ref: "#/components/schemas/metrics"
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
      const [metricsService] = await context.service(['metricsService']);
      const result = await metricsService.loadMetrics(requestContext);
      res.status(200).json(result);
    }),
  );

  return router;
}

module.exports = configure;
