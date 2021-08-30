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
import { Service } from '@aws-ee/base-services-container';
import { ensureAdmin, runAndCatch, generateId } from '@aws-ee/base-services';

import inputSchema from '../schema/create-workflow-instance.json';
import changeWorkflowStatusSchema from '../schema/change-workflow-status.json';
import changeStepStatusSchema from '../schema/change-step-status.json';
import saveStepAttributesSchema from '../schema/save-step-attributes.json';

const settingKeys = {
  tableName: 'dbWorkflowInstances',
};

const workflowIndexName = 'WorkflowIndex';
const workflowStatusIndexName = 'InstanceStatusCreatedIndex';

class WorkflowInstanceService extends Service {
  constructor() {
    super();
    this.dependency(['jsonSchemaValidationService', 'workflowService', 'dbService', 'auditWriterService']);
  }

  async init() {
    await super.init();
    this.tableName = this.settings.get(settingKeys.tableName);
  }

  async createInstance(requestContext, meta, input) {
    await ensureAdmin(requestContext);

    const [jsonSchemaValidationService, workflowService] = await this.service([
      'jsonSchemaValidationService',
      'workflowService',
    ]);

    // Validate input
    await jsonSchemaValidationService.ensureValid(meta, inputSchema);

    const { workflowId, workflowVer, runSpec, status, eventTriggerId } = meta;
    const workflow = await workflowService.mustFindVersion(requestContext, { id: workflowId, v: workflowVer });
    const [dbService] = await this.service(['dbService']);
    const table = this.tableName;

    // For now, we assume that 'createdBy' and 'updatedBy' are always users and not groups
    const by = _.get(requestContext, 'principalIdentifier.uid');

    const instance = await prepareNewInstance(workflow, { runSpec, status, eventTriggerId, input });

    const result = await runAndCatch(
      async () => {
        return dbService.helper
          .updater()
          .table(table)
          .condition('attribute_not_exists(id)') // yes we need this because we are using updater
          .key({ id: instance.id })
          .item({ ...instance, createdBy: by, updatedBy: by })
          .update();
      },
      async () => {
        throw this.boom.badRequest('Workflow instance already exist', true);
      },
    );

    // Write audit event
    await this.audit(requestContext, { action: 'create-workflow-instance', body: result });

    return result;
  }

  async changeWorkflowStatus(input) {
    const [jsonSchemaValidationService] = await this.service(['jsonSchemaValidationService']);
    // Validate input
    await jsonSchemaValidationService.ensureValid(input, changeWorkflowStatusSchema);
    const { instanceId, status, clearMessage = false, message } = input;

    const [dbService] = await this.service(['dbService']);
    const table = this.tableName;

    const result = await runAndCatch(
      async () => {
        const item = { wfStatus: status };
        let op = dbService.helper
          .updater()
          .table(table)
          .condition('attribute_exists(id)') // yes we need this
          .key({ id: instanceId });

        if (clearMessage) op = op.remove('msg');
        else if (!_.isUndefined(message)) item.msg = message;

        return op.item(item).update();
      },
      async () => {
        throw this.boom.badRequest(`Workflow instance "${instanceId}" does not exist`, true);
      },
    );

    return result;
  }

  /**
   * A method to save additional step attributes in form of key/value pairs to the specified step in the
   * specified workflow execution instance.
   *
   * @param input
   * @returns {Promise<void>}
   */
  async saveStepAttribs(requestContext, input) {
    // TODO: Workflow Permissions Management is not implemented yet
    //  For now, only admins are allowed to save additional attributes against steps in a running workflow
    //  Once Workflow Permissions Management is implemented, modify this to honor those permissions.
    //
    //  Since manual pause and play of a workflow uses this feature of saving a flag against a step to mark it
    //  paused/resumed this also means that only admins can resume a workflow manually as of now
    await ensureAdmin(requestContext);

    const [jsonSchemaValidationService, workflowService] = await this.service([
      'jsonSchemaValidationService',
      'workflowService',
    ]);

    await jsonSchemaValidationService.ensureValid(input, saveStepAttributesSchema);
    const { instanceId, stepIndex, attribs } = input;
    if (stepIndex < 0) {
      throw this.boom.badRequest(
        `Invalid stepIndex specified. It must be non-zero index corresponding to
         the step in the workflow for which you want to save attributes`,
        true,
      );
    }

    // update state in DynamoDB
    const [dbService] = await this.service(['dbService']);
    const table = this.tableName;

    const workflowInstance = await this.findInstance(requestContext, { id: instanceId });
    if (!workflowInstance) {
      throw this.boom.badRequest(`Workflow instance "${instanceId}" does not exist`, true);
    }
    const { wfId, wfVer, stAttribs: existingStepAttribs } = workflowInstance;
    const workflow = await workflowService.mustFindVersion(requestContext, { id: wfId, v: wfVer });
    if (stepIndex > workflow.selectedSteps.length) {
      throw this.boom.badRequest(
        `Invalid stepIndex specified. It must be non-zero index corresponding to
         the step in the workflow for which you want to save attributes.
         There is no step in the workflow at the specified step index`,
        true,
      );
    }
    const stepAttribsToSet = existingStepAttribs || [];

    // The "stepAttribsToSet" array contains additional step attributes for each step
    if (stepAttribsToSet.length - 1 < stepIndex) {
      // This is the first time some additional step attributes are being set for this step
      // The array may not have been expanded yet to accommodate attribs for this step yet
      // Fill array with empty objects as step attributes up to the step for which we are saving additional
      // step attributes. This approach allows for lazily fitting the step attributes into the stAttribs array
      // instead of populating them at item creation time in db
      for (let i = 0; i < stepIndex; i += 1) {
        if (_.isNil(stepAttribsToSet[i])) {
          // There are no additional attributes stored against the step at index = i so initialize it with empty object
          stepAttribsToSet[i] = {};
        }
      }
    }
    stepAttribsToSet[stepIndex] = attribs;

    const result = await runAndCatch(
      async () => {
        let op = dbService.helper
          .updater()
          .table(table)
          .condition('attribute_exists(id)') // yes we need this
          .key({ id: instanceId });

        if (!_.isUndefined(attribs)) {
          op = op
            .set(`#stAttribs = :stAttribs`)
            .names({ '#stAttribs': 'stAttribs' })
            .values({ ':stAttribs': stepAttribsToSet });
        }
        return op.update();
      },
      async () => {
        throw this.boom.badRequest(`Workflow instance "${instanceId}" does not exist`, true);
      },
    );

    // Write audit event
    await this.audit(requestContext, { action: 'save-workflow-instance-step-attributes', body: result });

    return result;
  }

  async changeStepStatus(input) {
    const [jsonSchemaValidationService] = await this.service(['jsonSchemaValidationService']);

    await jsonSchemaValidationService.ensureValid(input, changeStepStatusSchema);
    const { instanceId, stepIndex, status, clearMessage = false, message, startTime, endTime } = input;

    // update state in DynamoDB
    const [dbService] = await this.service(['dbService']);
    const table = this.tableName;

    const result = await runAndCatch(
      async () => {
        let op = dbService.helper
          .updater()
          .table(table)
          .condition('attribute_exists(id)') // yes we need this
          .key({ id: instanceId });

        if (clearMessage) {
          op = op.remove(`stStatuses[${stepIndex}].msg`);
        } else if (!_.isUndefined(message)) {
          op = op
            .set(`#stStatuses[${stepIndex}].msg = :stepMsg`)
            .names({ '#stStatuses': 'stStatuses' })
            .values({ ':stepMsg': message });
        }

        if (!_.isUndefined(status)) {
          op = op
            .set(`#stStatuses[${stepIndex}].#status = :stepStatus`)
            .names({ '#stStatuses': 'stStatuses', '#status': 'status' })
            .values({ ':stepStatus': status });
        }

        if (!_.isUndefined(startTime)) {
          op = op
            .set(`#stStatuses[${stepIndex}].#startTime = :stepStartTime`)
            .names({ '#stStatuses': 'stStatuses', '#startTime': 'startTime' })
            .values({ ':stepStartTime': startTime });
        }

        if (!_.isUndefined(endTime)) {
          op = op
            .set(`#stStatuses[${stepIndex}].#endTime = :stepEndTime`)
            .names({ '#stStatuses': 'stStatuses', '#endTime': 'endTime' })
            .values({ ':stepEndTime': endTime });
        }

        return op.update();
      },
      async () => {
        throw this.boom.badRequest(`Workflow instance "${instanceId}" does not exist`, true);
      },
    );

    return result;
  }

  // List the all workflow instances by status for a specified time period
  // startTime and endTime must be in ISO format
  async listByStatus(requestContext, { startTime, endTime, status, fields = [] } = {}) {
    await ensureAdmin(requestContext);
    const dbService = await this.service('dbService');
    const table = this.tableName;

    const result = await dbService.helper
      .query()
      .table(table)
      .index(workflowStatusIndexName)
      .key('wfStatus', status)
      .sortKey('createdAt')
      .between(startTime, endTime)
      .projection(fields)
      .query();

    return result;
  }

  // List the first 1000 instances sorted by createdAt (up to a year ago)
  async list(requestContext, { workflowId, workflowVer, fields = [] } = {}) {
    await ensureAdmin(requestContext);
    const dbService = await this.service('dbService');
    const table = this.tableName;
    const encodedId = encode(workflowId, workflowVer);
    const past = new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString(); // this is not accurate, just approximation for 12 months ago

    const result = await dbService.helper
      .query()
      .table(table)
      .index(workflowIndexName)
      .key('wf', encodedId)
      .sortKey('createdAt')
      .gt(past)
      .forward(false)
      .limit(1000)
      .projection(fields)
      .query();

    return result;
  }

  async listPaged(requestContext, { maxResults = 10, nextToken, fields = [] } = {}) {
    await ensureAdmin(requestContext);
    const dbService = await this.service('dbService');
    const table = this.tableName;

    const result = await dbService.helper
      .scanner()
      .table(table)
      .limit(maxResults)
      .projection(fields)
      .scanPage(nextToken);

    return result;
  }

  async findInstance(requestContext, { id, fields = [] }) {
    await ensureAdmin(requestContext);
    const dbService = await this.service('dbService');
    const table = this.tableName;

    const result = await dbService.helper
      .getter()
      .table(table)
      .key({ id })
      .projection(fields)
      .get();

    return result;
  }

  async mustFindInstance(requestContext, { id, fields }) {
    const instance = await this.findInstance(requestContext, { id, fields });
    if (!instance) throw this.boom.notFound(`The workflow instance "${id}" is not found`, true);
    return instance;
  }
}

// This captures the logic of populating the workflow instance object given a workflow object.
// Note: the provided workflow object will be mutated in process of creating the workflow instance.
async function prepareNewInstance(workflow, { runSpec = {}, status = 'not_started', eventTriggerId, input } = {}) {
  const id = await generateId();
  const wfId = workflow.id;
  const wfVer = workflow.v;
  const wf = encode(wfId, wfVer);
  const stStatuses = [];

  _.forEach(workflow.selectedSteps, step => {
    delete step.desc;
    delete step.propsOverrideOption;
    delete step.configOverrideOption;
    stStatuses.push({
      status: 'not_started',
    });
  });

  // We delete a few props from the workflow object to save space and bandwidth
  delete workflow.desc;
  delete workflow.createdBy;
  delete workflow.createdAt;
  delete workflow.updatedBy;
  delete workflow.updatedAt;
  delete workflow.rev;

  const instance = {
    id,
    workflow,
    wfId,
    wfVer,
    wf,
    wfStatus: status,
    stStatuses,
    runSpec: { ...workflow.runSpec, ...runSpec },
    eventTriggerId,
    input,
  };

  if (workflow.instanceTtl > 0) instance.ttl = workflow.instanceTtl * 24 * 60 * 60 + Math.floor(Date.now() / 1000);
  return instance;
}

function encode(id, v) {
  return `${id}_${v}`;
}

export default WorkflowInstanceService;
