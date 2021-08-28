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
import createSchema from '../schema/create-workflow-event-trigger.json';

const settingKeys = {
  tableName: 'dbWorkflowEventTriggers',
  workflowSolutionEventsHandlerArn: 'workflowSolutionEventsHandlerArn',
};

const workflowIndexName = 'WorkflowIndex';

class WorkflowEventTriggersService extends Service {
  constructor() {
    super();
    this.dependency(['jsonSchemaValidationService', 'dbService', 'auditWriterService', 'eventBridgeService']);
  }

  async init() {
    await super.init();
    this.workflowSolutionEventsHandlerArn = this.settings.get(settingKeys.workflowSolutionEventsHandlerArn);

    const [dbService] = await this.service(['dbService']);
    const table = this.settings.get(settingKeys.tableName);

    this._getter = () => dbService.helper.getter().table(table);
    this._scanner = () => dbService.helper.scanner().table(table);
    this._updater = () => dbService.helper.updater().table(table);
    this._query = () => dbService.helper.query().table(table);
    this._deleter = () => dbService.helper.deleter().table(table);
  }

  async find(requestContext, { id, fields = [] }) {
    await ensureAdmin(requestContext);
    const result = await this._getter()
      .key({ id })
      .projection(fields)
      .get();

    return this._fromDbToDataObject(result);
  }

  async mustFind(requestContext, { id, fields = [] }) {
    await ensureAdmin(requestContext);
    const result = await this.find(requestContext, { id, fields });
    if (!result) throw this.boom.notFound(`workflow event-trigger with id "${id}" does not exist`, true);
    return result;
  }

  async list(requestContext, { nextToken, maxResults = 10, fields = [] }) {
    await ensureAdmin(requestContext);
    const result = await this._scanner()
      .limit(maxResults)
      .projection(fields)
      .scanPage(nextToken);

    result.items = result.items.map(item => this._fromDbToDataObject(item));
    return result;
  }

  async listByWorkflow(requestContext, { workflowId, fields = [] }) {
    await ensureAdmin(requestContext);
    if (!_.isString(workflowId) || _.isEmpty(workflowId)) throw this.boom.badRequest('workflow id is missing');

    const result = await this._query()
      .index(workflowIndexName)
      .key('wf', workflowId)
      .limit(2000)
      .projection(fields)
      .query();

    return _.map(result, item => this._fromDbToDataObject(item));
  }

  async create(requestContext, rawData) {
    await ensureAdmin(requestContext);
    const [validationService] = await this.service(['jsonSchemaValidationService']);

    // Validate input
    await validationService.ensureValid(rawData, createSchema);

    const [eventBridgeService] = await this.service(['eventBridgeService']);

    const workflowId = _.get(rawData, 'workflowId');
    const workflowVer = _.get(rawData, 'workflowVer');

    // Rule creation
    const id = await this._getOrGenerateId(rawData);

    const ruleParams = {
      id,
      eventPattern: _.get(rawData, 'eventPattern'),
    };

    await eventBridgeService.createRule(requestContext, ruleParams);

    // Rule target creation
    const ruleTargetParams = {
      id,
      targetArn: this.workflowSolutionEventsHandlerArn,
      inputTransformer: {
        pathsMap: JSON.stringify({
          input: '$',
        }),
        // This needs to be a string because the placeholders must not contain quotes,
        // that's why we can't write this as an object and stringify
        template: `{ "input": <input>, "meta": { "workflowId": "${workflowId}", "workflowVer": ${workflowVer} } }`,
      },
    };

    const target = await eventBridgeService.createRuleTarget(requestContext, ruleTargetParams);

    // For now, we assume that 'createdBy' and 'updatedBy' are always users and not groups
    const by = _.get(requestContext, 'principalIdentifier.uid');

    // Save the rule to the database
    const dbObject = {
      id,
      wf: workflowId,
      workflowVer,
      eventPattern: _.get(rawData, 'eventPattern'),
      createdBy: by,
      updatedBy: by,
      targetIds: [target.id],
    };

    // Time to save the db object
    const result = await runAndCatch(
      async () => {
        return this._updater()
          .condition('attribute_not_exists(id)') // yes we need this
          .key({ id })
          .item(dbObject)
          .update();
      },
      async () => {
        throw this.boom.badRequest(`workflow event trigger with id "${id}" already exists`, true);
      },
    );

    // Write audit event
    await this.audit(requestContext, { action: 'create-workflow-event-trigger', body: result });

    return result;
  }

  async _getOrGenerateId(rawData) {
    const givenId = _.get(rawData, 'id');
    if (givenId) return givenId;
    const id = await generateId('wetr-');
    return id;
  }

  async delete(requestContext, { id }) {
    await ensureAdmin(requestContext);
    // Get the current event trigger
    const workflowEventTrigger = await this.mustFind(requestContext, { id });

    // Remove the targets and the rule from EventBridge
    const [eventBridgeService] = await this.service(['eventBridgeService']);
    const promises = workflowEventTrigger.targetIds.map(targetId => {
      return eventBridgeService.deleteRuleTarget(requestContext, { id: targetId, ruleId: id });
    });
    await Promise.all(promises);
    await eventBridgeService.deleteRule(requestContext, { id });

    // Lets now remove the item from the database
    const result = await runAndCatch(
      async () => {
        return this._deleter()
          .condition('attribute_exists(id)') // yes we need this
          .key({ id })
          .delete();
      },
      async () => {
        throw this.boom.notFound(`workflow event trigger with id "${id}" does not exist`, true);
      },
    );

    // Write audit event
    await this.audit(requestContext, { action: 'delete-workflow-event-trigger', body: { id } });

    return result;
  }

  // Do some properties renaming to restore the object that was saved in the database
  _fromDbToDataObject(rawDb, overridingProps = {}) {
    if (_.isNil(rawDb)) return rawDb; // important, leave this if statement here, otherwise, your update methods won't work correctly
    if (!_.isObject(rawDb)) return rawDb;

    const dataObject = { ...rawDb, ...overridingProps };
    return dataObject;
  }
}

export default WorkflowEventTriggersService;
