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
import { allowIfActive, generateId } from '@aws-ee/base-services';

import { Service } from '@aws-ee/base-services-container';
import createRuleSchema from '../schema/api/create-rule.json';
import deleteRuleSchema from '../schema/api/delete-rule.json';
import createRuleTargetSchema from '../schema/api/create-rule-target.json';
import deleteRuleTargetSchema from '../schema/api/delete-rule-target.json';
import publishEvent from '../schema/api/publish-event.json';

const settingKeys = {
  solutionEventBusName: 'solutionEventBusName',
};

class EventBridgeService extends Service {
  constructor() {
    super();
    this.dependency(['aws', 'authorizationService', 'auditWriterService', 'jsonSchemaValidationService']);
  }

  async init() {
    await super.init();

    this.solutionEventBusName = this.settings.optional(settingKeys.solutionEventBusName);
  }

  /**
   * Registers an event rule on the specified EventBridge bus, defaults to the solution-wide bus if no bus is specified.
   *
   * @param {Object} requestContext Request context object, as defined in `@aws-ee/base-services-container/lib/request-context`.
   * @param {Object} rawData The raw JSON request body containing the event pattern and the rule `id` which also serves as a name.
   *
   * @throws {BoomError} With code "badRequest" if `rawData` is in an unexpected format.
   * @returns {Promise<Object>} An object containing the `id` and `arn` of the newly created rule.
   */
  async createRule(requestContext, rawData, destinationEventBus = this.solutionEventBusName) {
    // Assert permissions
    await this._assertAuthorized(requestContext, { action: 'create-rule', conditions: [allowIfActive] });

    // Validate input
    const [validationService] = await this.service(['jsonSchemaValidationService']);
    await validationService.ensureValid(rawData, createRuleSchema);

    const [aws] = await this.service(['aws']);
    const eventBridgeClient = new aws.sdk.EventBridge();

    const id = _.get(rawData, 'id');
    let result;
    try {
      // Create the rule
      const params = {
        Name: id,
        EventBusName: destinationEventBus,
        EventPattern: _.get(rawData, 'eventPattern'),
        State: 'ENABLED',
      };

      result = await eventBridgeClient.putRule(params).promise();
    } catch (err) {
      this.log.error(err);
      throw this.boom.internalError(
        `Failed to create rule for bus ${destinationEventBus} and rule ${id}: ${err.message}`,
      );
    }

    // Write audit event
    await this.audit(requestContext, { action: 'create-rule', body: { ...rawData, destinationEventBus } });

    return { id, arn: _.get(result, 'RuleArn') };
  }

  /**
   * Deletes an event rule on the specified EventBridge bus.
   *
   * @param {Object} requestContext Request context object, as defined in `@aws-ee/base-services-container/lib/request-context`.
   * @param {Object} rawData The raw JSON request body containing the `id` of the rule to delete.
   *
   * @throws {BoomError} With code "badRequest" if `rawData` is in an unexpected format.
   * @returns {Promise<Object>} An object containing the `id` of the deleted rule.
   */
  async deleteRule(requestContext, rawData, destinationEventBus = this.solutionEventBusName) {
    // Assert permissions
    await this._assertAuthorized(requestContext, { action: 'delete-rule', conditions: [allowIfActive] });

    // Validate input
    const [validationService] = await this.service(['jsonSchemaValidationService']);
    await validationService.ensureValid(rawData, deleteRuleSchema);

    const [aws] = await this.service(['aws']);
    const eventBridgeClient = new aws.sdk.EventBridge();

    const id = _.get(rawData, 'id');

    try {
      // Delete the rule
      const params = {
        Name: id,
        EventBusName: destinationEventBus,
      };

      await eventBridgeClient.deleteRule(params).promise();
    } catch (err) {
      this.log.error(err);
      throw this.boom.internalError(
        `Failed to delete rule for bus ${destinationEventBus} and rule ${id}: ${err.message}`,
      );
    }

    // Write audit event
    await this.audit(requestContext, { action: 'delete-rule', body: { ...rawData, destinationEventBus } });

    return { id };
  }

  /**
   * Registers a target for an event rule on the specified EventBridge bus, defaults to the solution-wide bus if no bus is specified.
   *
   * @param {Object} requestContext Request context object, as defined in `@aws-ee/base-services-container/lib/request-context`.
   * @param {Object} rawData The raw JSON request body containing the rule `id`, the `targetArn` and an optional `inputTransformer`.
   *
   * @throws {BoomError} With code "badRequest" if `rawData` is in an unexpected format.
   * @returns {Promise<Object>} An object containing the `id` of the target.
   */
  async createRuleTarget(requestContext, rawData, destinationEventBus = this.solutionEventBusName) {
    // Assert permissions
    await this._assertAuthorized(requestContext, { action: 'create-rule-target', conditions: [allowIfActive] });

    // Validate input
    const [validationService] = await this.service(['jsonSchemaValidationService']);
    await validationService.ensureValid(rawData, createRuleTargetSchema);

    const [aws] = await this.service(['aws']);
    const eventBridgeClient = new aws.sdk.EventBridge();

    const ruleId = _.get(rawData, 'id');
    const pathsMap = _.get(rawData, 'inputTransformer.pathsMap');
    // This cannot be more than 64 characters in length and you need it later to removeTargets before deleting rule
    const id = await generateId('eb-');
    try {
      // Create the rule target
      const params = {
        Rule: ruleId,
        Targets: [
          {
            Arn: _.get(rawData, 'targetArn'),
            Id: id,
            InputTransformer: {
              InputTemplate: _.get(rawData, 'inputTransformer.template'),
              InputPathsMap: _.isEmpty(pathsMap) ? undefined : JSON.parse(pathsMap),
            },
          },
        ],
        EventBusName: destinationEventBus,
      };

      await eventBridgeClient.putTargets(params).promise();
    } catch (err) {
      this.log.error(err);
      throw this.boom.internalError(
        `Failed to create rule target for bus ${destinationEventBus} and rule ${ruleId}: ${err.message}`,
      );
    }

    // Write audit event
    await this.audit(requestContext, {
      action: 'create-rule-target',
      body: { ruleId, id, ..._.omit(rawData), destinationEventBus },
    });

    return { ruleId, id };
  }

  /**
   * Deletes a rule target from a rule on the specified EventBridge bus.
   *
   * @param {Object} requestContext Request context object, as defined in `@aws-ee/base-services-container/lib/request-context`.
   * @param {Object} rawData The raw JSON request body containing the target `id` and the `ruleId`.
   *
   * @throws {BoomError} With code "badRequest" if `rawData` is in an unexpected format.
   * @returns {Promise<Object>} An object containing the `id` of the deleted target and the `ruleId`.
   */
  async deleteRuleTarget(requestContext, rawData, destinationEventBus = this.solutionEventBusName) {
    // Assert permissions
    await this._assertAuthorized(requestContext, { action: 'delete-rule-target', conditions: [allowIfActive] });

    // Validate input
    const [validationService] = await this.service(['jsonSchemaValidationService']);
    await validationService.ensureValid(rawData, deleteRuleTargetSchema);

    const [aws] = await this.service(['aws']);
    const eventBridgeClient = new aws.sdk.EventBridge();

    const id = _.get(rawData, 'id');
    const ruleId = _.get(rawData, 'ruleId');

    try {
      // Delete the rule
      const params = {
        Ids: [id],
        Rule: ruleId,
        EventBusName: destinationEventBus,
      };

      await eventBridgeClient.removeTargets(params).promise();
    } catch (err) {
      this.log.error(err);
      throw this.boom.internalError(
        `Failed to delete rule target for bus ${destinationEventBus}, rule ${ruleId} and rule target ${id}: ${err.message}`,
      );
    }

    // Write audit event
    await this.audit(requestContext, {
      action: 'delete-rule-target',
      body: { ruleId, id, ..._.omit(rawData), destinationEventBus },
    });

    return { id, ruleId };
  }

  /**
   * Publishes the event to the specified EventBridge bus, defaults to the solution-wide bus if no bus is specified.
   *
   * @param {Object} requestContext Request context object, as defined in `@aws-ee/base-services-container/lib/request-context`.
   * @param {Object} rawEvent The raw JSON event to be published on the bus.
   *
   * @throws {BoomError} With code "badRequest" if `rawEvent` is in an unexpected format.
   * @returns {Promise<Array>} An array containing the EventBridge IDs of the new events that were published on the solution-wide event bus.
   */
  async publishEvent(requestContext, rawEvent, destinationEventBus = this.solutionEventBusName) {
    // Assert permissions
    await this._assertAuthorized(requestContext, { action: 'publish', conditions: [allowIfActive] });

    const [aws] = await this.service(['aws']);
    const eventBridgeClient = new aws.sdk.EventBridge();

    // Validate input
    const [validationService] = await this.service(['jsonSchemaValidationService']);
    await validationService.ensureValid(rawEvent, publishEvent);

    // Map the common event schema to the EventBridge base schema
    const params = {
      Entries: [
        {
          Detail: JSON.stringify(_.get(rawEvent, 'detail')),
          DetailType: _.get(rawEvent, 'detailType'),
          EventBusName: destinationEventBus,
          Source: _.get(rawEvent, 'sourceSystem'),
          Time: _.get(rawEvent, 'createdAt'),
        },
      ],
    };

    // Publish the event
    let result;
    try {
      result = await eventBridgeClient.putEvents(params).promise();
    } catch (err) {
      this.log.error(err);
      throw this.boom.internalError(`Failed to put events on bus ${destinationEventBus}: ${err.message}`);
    }

    // Get the list of the published events (should be just 1), and map it as an array of the EventBridge IDs given to them
    let newEntries = _.get(result, 'Entries');
    if (_.isArray(newEntries)) {
      newEntries = newEntries.map(entry => entry.EventId);
    } else {
      newEntries = [];
    }

    await this.audit(requestContext, { action: 'publish-event', body: { rawEvent, result, newEntries } });

    return newEntries;
  }

  async _assertAuthorized(requestContext, { action, conditions }, ...args) {
    const authorizationService = await this.service('authorizationService');
    await authorizationService.assertAuthorized(
      requestContext,
      { extensionPoint: 'eventbridge-authz', action, conditions },
      ...args,
    );
  }
}

export default EventBridgeService;
