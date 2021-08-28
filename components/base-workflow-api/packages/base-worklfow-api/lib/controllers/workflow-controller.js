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

import _ from 'lodash';

/**
 * Configures API routes
 *
 * @param context - an instance of the AppContext defined in base-rest-api
 *
 * @openapi
 * components:
 *   parameters:
 *     workflowId:
 *       name: id
 *       required: true
 *       in: path
 *       description: Workflow id
 *       schema:
 *         type: string
 *     workflowVersion:
 *       name: v
 *       required: true
 *       in: path
 *       description: Workflow version
 *       schema:
 *         type: number
 *   responses:
 *     Workflow:
 *       description: Workflow
 *     Workflows:
 *       description: Workflows
 */
async function configure(context) {
  const router = context.router();
  const wrap = context.wrap;
  const boom = context.boom;
  const settings = context.settings;

  const workflowService = await context.service('workflowService');
  const workflowDraftService = await context.service('workflowDraftService');
  const workflowInstanceService = await context.service('workflowInstanceService');
  const workflowTriggerService = await context.service('workflowTriggerService');
  const workflowEventTriggersService = await context.service('workflowEventTriggersService');

  /**
   * @openapi
   * paths:
   *   /api/workflows/{id}/v/{v}/trigger:
   *     post:
   *       summary: Trigger workflow
   *       description: Triggers the specified version of the workflow with specified id using swWorkflow defined in context.settings
   *       operationId: triggerWorkflowVersion
   *       parameters:
   *         - name: workflowId
   *           in: query
   *           schema:
   *               $ref: "#/components/schemas/triggerWorkflow/properties/workflowId"
   *         - name: workflowVer
   *           in: query
   *           schema:
   *               $ref: "#/components/schemas/triggerWorkflow/properties/workflowVer"
   *       requestBody:
   *         required: true
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required:
   *                 - input
   *                 - meta
   *               properties:
   *                 input:
   *                   description: Input
   *                   type: object
   *                 meta:
   *                   description: Metadata
   *                   $ref: "#/components/schemas/triggerWorkflow"
   *       tags:
   *         - Workflows
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/Success"
   *         "400":
   *           $ref: "#/components/responses/InvalidInput"
   */
  router.post(
    '/:id/v/:v/trigger',
    wrap(async (req, res) => {
      const id = req.params.id;
      const vStr = req.params.v;
      const input = _.get(req.body, 'input');
      const meta = _.get(req.body, 'meta', {});
      const requestContext = res.locals.requestContext;

      meta.workflowId = id;
      meta.workflowVer = parseInt(vStr, 10);
      meta.smWorkflow = settings.get('smWorkflow');

      const result = await workflowTriggerService.triggerWorkflow(requestContext, meta, input);
      res.status(200).json(result);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/workflows/{id}/v/{v}/instances:
   *     get:
   *       summary: List all workflow version instances
   *       description: Lists all instances of the specified version of the workflow with specified id
   *       operationId: listWorkflowInstances
   *       parameters:
   *         - $ref: "#/components/parameters/workflowId"
   *         - $ref: "#/components/parameters/workflowVersion"
   *       tags:
   *         - Workflows
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/Workflows"
   */
  router.get(
    '/:id/v/:v/instances',
    wrap(async (req, res) => {
      const id = req.params.id;
      const v = req.params.v;
      const requestContext = res.locals.requestContext;

      const result = await workflowInstanceService.list(requestContext, {
        workflowId: id,
        workflowVer: v,
      });
      res.status(200).json(result);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/workflows/{id}/v/{v}/instances/{instanceId}:
   *     get:
   *       summary: Get workflow
   *       description: Gets the specified instance of the specified version of the workflow with specified id
   *       operationId: getWorkflowInstance
   *       parameters:
   *         - $ref: "#/components/parameters/workflowId"
   *         - $ref: "#/components/parameters/workflowVersion"
   *       tags:
   *         - Workflows
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/Workflow"
   *         "404":
   *           $ref: "#/components/responses/NotFound"
   */
  router.get(
    '/:id/v/:v/instances/:instanceId',
    wrap(async (req, res) => {
      const instanceId = req.params.instanceId;
      const requestContext = res.locals.requestContext;

      const result = await workflowInstanceService.mustFindInstance(requestContext, {
        id: instanceId,
      });
      res.status(200).json(result);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/workflows/instances/status/{status}:
   *     post:
   *       summary: List workflows by status
   *       description: Lists all instances with specified status between specified start and end times
   *       operationId: listWorkflowsStatus
   *       parameters:
   *         - name: status
   *           in: path
   *           description: Workflow status
   *           required: true
   *           schema:
   *             type: string
   *       requestBody:
   *         required: true
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               required: [startTime, endTime]
   *               properties:
   *                 startTime:
   *                   type: string
   *                   description: ISO format
   *                 endTime:
   *                   type: string
   *                   description: ISO format
   *       tags:
   *         - Workflows
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/Workflows"
   */
  router.post(
    '/instances/status/:status',
    wrap(async (req, res) => {
      const status = req.params.status;
      const { startTime, endTime } = req.body;
      const requestContext = res.locals.requestContext;

      const result = await workflowInstanceService.listByStatus(requestContext, {
        status,
        startTime,
        endTime,
      });
      res.status(200).json(result);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/workflows/{id}/event-triggers:
   *     get:
   *       summary: List event triggers
   *       description: Lists all event triggers for workflow with specified id
   *       operationId: listEventTriggers
   *       parameters:
   *         - $ref: "#/components/parameters/workflowId"
   *       tags:
   *         - Workflows
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/Workflows"
   *         "400":
   *           $ref: "#/components/responses/InvalidInput"
   */
  router.get(
    '/:id/event-triggers',
    wrap(async (req, res) => {
      const requestContext = res.locals.requestContext;
      const id = req.params.id;

      const result = await workflowEventTriggersService.listByWorkflow(requestContext, { workflowId: id });
      res.status(200).json(result);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/workflows/{id}/event-triggers:
   *     post:
   *       summary: Create event trigger
   *       description: Creates an event trigger for workflow with specified id
   *       operationId: createEventTriggers
   *       parameters:
   *         - $ref: "#/components/parameters/workflowId"
   *       requestBody:
   *         required: true
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/createWorkflowEventTrigger"
   *       tags:
   *         - Workflows
   *       responses:
   *         "201":
   *           $ref: "#/components/responses/Workflows"
   *         "400":
   *           $ref: "#/components/responses/InvalidInput"
   */
  router.post(
    '/:id/event-triggers',
    wrap(async (req, res) => {
      const requestContext = res.locals.requestContext;

      const result = await workflowEventTriggersService.create(requestContext, req.body);
      res.status(201).json(result);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/workflows/{id}/event-triggers/eventTriggerId:
   *     delete:
   *       summary: Delete event trigger
   *       description: Deletes event trigger with specified id for workflow with specified id
   *       operationId: deleteEventTriggers
   *       parameters:
   *         - $ref: "#/components/parameters/workflowId"
   *         - name: eventTriggerId
   *           required: true
   *           in: path
   *           description: Event trigger id
   *           schema:
   *             type: string
   *       tags:
   *         - Workflows
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/Success"
   *         "404":
   *           $ref: "#/components/responses/NotFound"
   */
  router.delete(
    '/:id/event-triggers/:eventTriggerId',
    wrap(async (req, res) => {
      const requestContext = res.locals.requestContext;
      const id = req.params.eventTriggerId;

      await workflowEventTriggersService.delete(requestContext, { id });
      res.status(200).json({});
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/workflows/drafts:
   *     get:
   *       summary: List draft workflows
   *       description: Lists all draft workflows
   *       operationId: listDraftWorkflows
   *       tags:
   *         - Workflows
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/Workflows"
   */
  router.get(
    '/drafts',
    wrap(async (_req, res) => {
      const requestContext = res.locals.requestContext;

      const result = await workflowDraftService.list(requestContext);
      res.status(200).json(result);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/workflows:
   *     get:
   *       summary: List all versions of all workflows
   *       description: Lists all versions for all workflows
   *       operationId: listWorkflowsVersions
   *       parameters:
   *         - $ref: "#/components/parameters/workflowId"
   *         - $ref: "#/components/parameters/workflowVersion"
   *       tags:
   *         - Workflows
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/Workflows"
   */
  router.get(
    '/',
    wrap(async (_req, res) => {
      const requestContext = res.locals.requestContext;
      const result = await workflowService.listVersions(requestContext);
      res.status(200).json(result);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/workflows/latest:
   *     get:
   *       summary: List latest versions of all workflows
   *       description: Lists latest versions of all the workflows, limited to a maximum of 500
   *       operationId: listLatestWorkflowsVersions
   *       tags:
   *         - Workflows
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/Workflows"
   */
  router.get(
    '/latest',
    wrap(async (_req, res) => {
      const requestContext = res.locals.requestContext;
      // Limit set at 500 to avoid hitting the 1MB DynamoDB threshold.
      // TODO: Ideally, this should be refactored to use paging.
      const result = await workflowService.list(requestContext, { maxResults: 500 });
      res.status(200).json(result.items);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/workflows/{id}:
   *     get:
   *       summary: List workflow versions
   *       description: Lists versions of workflow with specified id
   *       operationId: listWorkflowVersions
   *       parameters:
   *         - $ref: "#/components/parameters/workflowId"
   *       tags:
   *         - Workflows
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/Workflows"
   */
  router.get(
    '/:id',
    wrap(async (req, res) => {
      const id = req.params.id;
      const requestContext = res.locals.requestContext;

      const result = await workflowService.listVersions(requestContext, { id });
      res.status(200).json(result);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/workflows/{id}/latest:
   *     get:
   *       summary: Gets latest workflow version
   *       description: Gets latest version of workflow with specified id
   *       operationId: getLatestWorkflowVersion
   *       parameters:
   *         - $ref: "#/components/parameters/workflowId"
   *       tags:
   *         - Workflows
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/Workflow"
   *         "404":
   *           $ref: "#/components/responses/NotFound"
   */
  router.get(
    '/:id/latest',
    wrap(async (req, res) => {
      const id = req.params.id;
      const requestContext = res.locals.requestContext;

      const result = await workflowService.mustFindVersion(requestContext, { id });
      res.status(200).json(result);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/workflows/{id}/v/{v}:
   *     get:
   *       summary: Get workflow version
   *       description: Gets the specified version of the workflow with specified id
   *       operationId: getWorkflowVersion
   *       parameters:
   *         - $ref: "#/components/parameters/workflowId"
   *         - $ref: "#/components/parameters/workflowVersion"
   *       tags:
   *         - Workflows
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/Workflow"
   *         "404":
   *           $ref: "#/components/responses/NotFound"
   */
  router.get(
    '/:id/v/:v',
    wrap(async (req, res) => {
      const id = req.params.id;
      const v = req.params.v;
      const requestContext = res.locals.requestContext;

      const result = await workflowService.mustFindVersion(requestContext, { id, v });
      res.status(200).json(result);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/workflows/{id}/v:
   *     post:
   *       summary: Create workflow version
   *       description: Creates a new version of the workflow with specified id
   *       operationId: createWorkflowVersion
   *       parameters:
   *         - $ref: "#/components/parameters/workflowId"
   *       requestBody:
   *         required: true
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/workflow"
   *       tags:
   *         - Workflows
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/Workflow"
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

      if (manifest.id !== id) throw boom.badRequest('The workflow ids do not match', true);

      const result = await workflowService.createVersion(requestContext, manifest);
      res.status(200).json(result);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/workflows/drafts:
   *     post:
   *       summary: Create draft workflow
   *       description: Creates a draft workflow
   *       operationId: createDraftWorkflow
   *       requestBody:
   *         required: true
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 isNewWorkflow:
   *                   type: boolean
   *                 workflowId:
   *                   type: string
   *                 workflowVer:
   *                   type: number
   *                 templateId:
   *                   type: string
   *                 templateVer:
   *                   type: number
   *       tags:
   *         - Workflows
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/Workflow"
   *         "400":
   *           $ref: "#/components/responses/InvalidInput"
   *         "404":
   *           $ref: "#/components/responses/NotFound"
   */
  router.post(
    '/drafts',
    wrap(async (req, res) => {
      const requestContext = res.locals.requestContext;
      const possibleBody = req.body;
      const result = await workflowDraftService.createDraft(requestContext, possibleBody);

      res.status(200).json(result);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/workflows/drafts/publish:
   *     post:
   *       summary: Publish draft workflow
   *       description: Publish a draft workflow
   *       operationId: publishDraftWorkflow
   *       requestBody:
   *         required: true
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/workflow"
   *       tags:
   *         - Workflows
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/Workflow"
   *         "400":
   *           $ref: "#/components/responses/InvalidInput"
   *         "403":
   *           $ref: "#/components/responses/Forbidden"
   *         "404":
   *           $ref: "#/components/responses/NotFound"
   */
  router.post(
    '/drafts/publish',
    wrap(async (req, res) => {
      const requestContext = res.locals.requestContext;
      const draft = req.body;
      const result = await workflowDraftService.publishDraft(requestContext, draft);

      res.status(200).json(result);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/workflows/drafts/{id}:
   *     put:
   *       summary: Update draft workflow
   *       description: Updates the draft workflow with specified id
   *       operationId: updateDraftWorkflow
   *       requestBody:
   *         required: true
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/workflow"
   *       tags:
   *         - Workflows
   *       responses:
   *         "200":
   *           $ref: "#/components/responses/Workflow"
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

      if (draft.id !== id) throw boom.badRequest('The workflow draft ids do not match', true);

      const result = await workflowDraftService.updateDraft(requestContext, draft);
      res.status(200).json(result);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/workflows/drafts/{id}:
   *     delete:
   *       summary: Delete draft workflow
   *       description: Deletes the draft workflow with specified id
   *       operationId: deleteDraftWorkflow
   *       tags:
   *         - Workflows
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

      await workflowDraftService.deleteDraft(requestContext, { id });
      res.status(200).json({});
    }),
  );

  return router;
}

export default configure;
