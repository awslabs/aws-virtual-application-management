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
 *     stepTemplateId:
 *       name: id
 *       required: true
 *       in: path
 *       description: Step template id
 *       schema:
 *         type: string
 *     stepTemplateVersion:
 *       name: v
 *       required: true
 *       in: path
 *       description: Step template version
 *       schema:
 *         type: number
 *   responses:
 *     StepTemplate:
 *       description: StepTemplate
 *     StepTemplates:
 *       description: StepTemplates
 */
async function configure(context) {
  const router = context.router();
  const wrap = context.wrap;

  const stepTemplateService = await context.service('stepTemplateService');

  /**
   * @openapi
   * paths:
   *   /api/step-templates:
   *     get:
   *       summary: List all step templates
   *       description: Lists all versions of all the step templates
   *       operationId: listAllStepTemplates
   *       tags:
   *         - Step Templates
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/StepTemplates"
   */
  router.get(
    '/',
    wrap(async (req, res) => {
      const requestContext = res.locals.requestContext;
      const result = await stepTemplateService.listVersions(requestContext);
      res.status(200).json(result);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/step-templates/latest:
   *     get:
   *       summary: List latest step template versions
   *       description: Lists latest versions of all the step templates
   *       operationId: listAllLatestStepTemplates
   *       tags:
   *         - Step Templates
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/StepTemplates"
   */
  router.get(
    '/latest',
    wrap(async (req, res) => {
      const requestContext = res.locals.requestContext;
      const result = await stepTemplateService.list(requestContext);
      res.status(200).json(result);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/step-templates/{id}:
   *     get:
   *       summary: List step template versions
   *       description: Lists all versions of the step template with specified id
   *       operationId: listStepTemplates
   *       parameters:
   *         - $ref: "#/components/parameters/stepTemplateId"
   *       tags:
   *         - Step Templates
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/StepTemplates"
   */
  router.get(
    '/:id',
    wrap(async (req, res) => {
      const id = req.params.id;
      const requestContext = res.locals.requestContext;
      const result = await stepTemplateService.listVersions(requestContext, { id });
      res.status(200).json(result);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/step-templates/{id}/latest:
   *     get:
   *       summary: Get latest step template version
   *       description: Gets latest version of step template with specified id
   *       operationId: getLatestStepTemplate
   *       parameters:
   *         - $ref: "#/components/parameters/stepTemplateId"
   *       tags:
   *         - Step Templates
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/StepTemplates"
   *         "404":
   *           $ref: "#/components/responses/NotFound"
   */
  router.get(
    '/:id/latest',
    wrap(async (req, res) => {
      const id = req.params.id;
      const requestContext = res.locals.requestContext;
      const result = await stepTemplateService.mustFindVersion(requestContext, { id });
      res.status(200).json(result);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/step-templates/{id}/v/{v}:
   *     get:
   *       summary: Get step template version
   *       description: Gets the specified version of the step template with specified id
   *       operationId: getStepTemplateVersion
   *       parameters:
   *         - $ref: "#/components/parameters/stepTemplateId"
   *         - $ref: "#/components/parameters/stepTemplateVersion"
   *       tags:
   *         - Step Templates
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/StepTemplate"
   *         "404":
   *           $ref: "#/components/responses/NotFound"
   */
  router.get(
    '/:id/v/:v',
    wrap(async (req, res) => {
      const id = req.params.id;
      const v = req.params.v;
      const requestContext = res.locals.requestContext;
      const result = await stepTemplateService.mustFindVersion(requestContext, { id, v });
      res.status(200).json(result);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/step-templates/{id}/v/{v}/validate:
   *     post:
   *       summary: Validate step template version
   *       description: Validates the specified version of the step template with specified id
   *       operationId: validateStepTemplateVersion
   *       parameters:
   *         - $ref: "#/components/parameters/stepTemplateId"
   *         - $ref: "#/components/parameters/stepTemplateVersion"
   *       tags:
   *         - Step Templates
   *       responses:
   *         "200":
   *           description: "Validation errors"
   */
  router.post(
    '/:id/v/:v/validate',
    wrap(async (req, res) => {
      const {
        params: { id, v },
        body: config = {},
      } = req;

      const requestContext = res.locals.requestContext;
      const result = await stepTemplateService.mustValidateVersion(requestContext, { id, v, config });
      res.status(200).json(result);
    }),
  );

  return router;
}

export default configure;
