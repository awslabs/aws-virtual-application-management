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
 *     workflowTemplateId:
 *       name: id
 *       required: true
 *       in: path
 *       description: Workflow template id
 *       schema:
 *         type: string
 *     workflowTemplateVersion:
 *       name: v
 *       required: true
 *       in: path
 *       description: Workflow template version
 *       schema:
 *         type: number
 *   responses:
 *     WorkflowTemplate:
 *       description: Workflow template
 *     WorkflowTemplates:
 *       description: Workflow templates
 */
async function configure(context) {
  const router = context.router();
  const wrap = context.wrap;
  const boom = context.boom;

  const workflowTemplateService = await context.service('workflowTemplateService');
  const workflowTemplateDraftService = await context.service('workflowTemplateDraftService');

  /**
   * @openapi
   * paths:
   *   /api/workflow-templates/drafts:
   *     get:
   *       summary: List draft workflow templates
   *       description: Lists all draft workflow templates
   *       operationId: listDraftWorkflowTemplates
   *       tags:
   *         - Workflow Templates
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/WorkflowTemplates"
   */
  router.get(
    '/drafts',
    wrap(async (req, res) => {
      const requestContext = res.locals.requestContext;
      const result = await workflowTemplateDraftService.list(requestContext);

      res.status(200).json(result);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/workflow-templates:
   *     get:
   *       summary: List all versions of all workflow templates
   *       description: Lists all versions of all workflow templates
   *       operationId: listAllWorkflowTemplateVersions
   *       tags:
   *         - Workflow Templates
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/WorkflowTemplates"
   */
  router.get(
    '/',
    wrap(async (req, res) => {
      const requestContext = res.locals.requestContext;
      const result = await workflowTemplateService.listVersions(requestContext);
      res.status(200).json(result);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/workflow-templates/latest:
   *     get:
   *       summary: List latest versions of all the workflow templates
   *       description: Lists latest versions of all the workflow templates
   *       operationId: listLatestWorkflowTemplateVersions
   *       tags:
   *         - Workflow Templates
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/WorkflowTemplates"
   */
  router.get(
    '/latest',
    wrap(async (req, res) => {
      const requestContext = res.locals.requestContext;
      const result = await workflowTemplateService.list(requestContext);
      res.status(200).json(result);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/workflow-templates/{id}:
   *     get:
   *       summary: List workflow template versions
   *       description: Lists versions of workflow template with specified id
   *       operationId: listWorkflowTemplateVersions
   *       tags:
   *         - Workflow Templates
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/WorkflowTemplates"
   */
  router.get(
    '/:id',
    wrap(async (req, res) => {
      const id = req.params.id;
      const requestContext = res.locals.requestContext;
      const result = await workflowTemplateService.listVersions(requestContext, { id });
      res.status(200).json(result);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/workflow-templates/{id}/latest:
   *     get:
   *       summary: Get latest version of workflow template
   *       description: Gets latest version of the workflow template with specified id
   *       operationId: listLatestWorkflowTemplatesVersions
   *       tags:
   *         - Workflow Templates
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/WorkflowTemplate"
   *         "404":
   *           $ref: "#/components/responses/NotFound"
   */
  router.get(
    '/:id/latest',
    wrap(async (req, res) => {
      const id = req.params.id;
      const requestContext = res.locals.requestContext;
      const result = await workflowTemplateService.mustFindVersion(requestContext, { id });
      res.status(200).json(result);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/workflow-templates/{id}/v/{v}:
   *     get:
   *       summary: Get workflow template version
   *       description: Gets the specified version of the workflow template with specified id
   *       operationId: getWorkflowTemplateVersion
   *       parameters:
   *         - $ref: "#/components/parameters/workflowTemplateId"
   *         - $ref: "#/components/parameters/workflowTemplateVersion"
   *       tags:
   *         - Workflow Templates
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/WorkflowTemplate"
   *         "404":
   *           $ref: "#/components/responses/NotFound"
   */
  router.get(
    '/:id/v/:v',
    wrap(async (req, res) => {
      const id = req.params.id;
      const v = req.params.v;
      const requestContext = res.locals.requestContext;
      const result = await workflowTemplateService.mustFindVersion(requestContext, { id, v });
      res.status(200).json(result);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/workflow-templates/{id}/v:
   *     post:
   *       summary: Create workflow template version
   *       description: Creates a new version of the workflow template with specified id
   *       operationId: createWorkflowTemplateVersion
   *       parameters:
   *         - $ref: "#/components/parameters/workflowTemplateId"
   *       requestBody:
   *         required: true
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/workflowTemplate"
   *       tags:
   *         - Workflow Templates
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/WorkflowTemplate"
   *         "400":
   *           $ref: "#/components/responses/InvalidInput"
   *         "403":
   *           $ref: "#/components/responses/Forbidden"
   */
  router.post(
    '/:id/v/',
    wrap(async (req, res) => {
      const id = req.params.id;
      const requestContext = res.locals.requestContext;
      const manifest = req.body;

      if (manifest.id !== id) throw boom.badRequest('The workflow template ids do not match', true);

      const result = await workflowTemplateService.createVersion(requestContext, manifest);
      res.status(200).json(result);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/workflow-templates/drafts:
   *     post:
   *       summary: Create workflow template draft
   *       description: Creates a new draft workflow template
   *       operationId: createDraftWorkflowTemplate
   *       requestBody:
   *         required: true
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 isNewTemplate:
   *                   type: boolean
   *                 templateId:
   *                   type: string
   *                 templateTitle:
   *                   type: string
   *                 templateVer:
   *                   type: number
   *       tags:
   *         - Workflow Templates
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/WorkflowTemplate"
   *         "400":
   *           $ref: "#/components/responses/InvalidInput"
   */
  router.post(
    '/drafts',
    wrap(async (req, res) => {
      const requestContext = res.locals.requestContext;
      const possibleBody = req.body;
      const result = await workflowTemplateDraftService.createDraft(requestContext, possibleBody);

      res.status(200).json(result);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/workflow-templates/drafts/publish:
   *     post:
   *       summary: Publish workflow template draft
   *       description: Publishes a new draft workflow template
   *       operationId: publishDraftWorkflowTemplate
   *       requestBody:
   *         required: true
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/workflowTemplate"
   *       tags:
   *         - Workflow Templates
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/WorkflowTemplate"
   *         "400":
   *           $ref: "#/components/responses/InvalidInput"
   *         "403":
   *           $ref: "#/components/responses/Forbidden"
   */
  router.post(
    '/drafts/publish',
    wrap(async (req, res) => {
      const requestContext = res.locals.requestContext;
      const draft = req.body;
      const result = await workflowTemplateDraftService.publishDraft(requestContext, draft);

      res.status(200).json(result);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/workflow-templates/drafts/publish:
   *     put:
   *       summary: Update workflow template draft
   *       description: Updates the draft workflow template with specified id
   *       operationId: updateDraftWorkflowTemplate
   *       parameters:
   *         - $ref: "#/components/parameters/workflowTemplateId"
   *       requestBody:
   *         required: true
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/workflowTemplate"
   *       tags:
   *         - Workflow Templates
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/WorkflowTemplate"
   *         "400":
   *           $ref: "#/components/responses/InvalidInput"
   *         "403":
   *           $ref: "#/components/responses/Forbidden"
   *         "404":
   *           $ref: "#/components/responses/NotFound"
   */
  router.put(
    '/drafts/:id',
    wrap(async (req, res) => {
      const id = req.params.id;
      const requestContext = res.locals.requestContext;
      const draft = req.body;

      if (draft.id !== id) throw boom.badRequest('The workflow template draft ids do not match', true);

      const result = await workflowTemplateDraftService.updateDraft(requestContext, draft);
      res.status(200).json(result);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/workflow-templates/drafts/publish:
   *     delete:
   *       summary: Delete workflow template draft
   *       description: Deletes the draft template with specified id
   *       operationId: deleteDraftWorkflowTemplate
   *       parameters:
   *         - $ref: "#/components/parameters/workflowTemplateId"
   *       tags:
   *         - Workflow Templates
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/Success"
   *         "403":
   *           $ref: "#/components/responses/Forbidden"
   *         "404":
   *           $ref: "#/components/responses/NotFound"
   */
  router.delete(
    '/drafts/:id',
    wrap(async (req, res) => {
      const id = req.params.id;
      const requestContext = res.locals.requestContext;

      await workflowTemplateDraftService.deleteDraft(requestContext, { id });
      res.status(200).json({});
    }),
  );

  return router;
}

export default configure;
