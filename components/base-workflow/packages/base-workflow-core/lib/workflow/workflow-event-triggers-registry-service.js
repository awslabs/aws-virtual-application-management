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
import inputSchema from '../schema/create-workflow-event-trigger.json';

class WorkflowEventTriggersRegistryService extends Service {
  constructor() {
    super();
    this.dependency(['jsonSchemaValidationService', 'pluginRegistryService']);
  }

  async init() {
    await super.init();
    this.store = {}; // a map { <id>: { id, triggerType, triggerData, wf } }

    const registry = await this.service('pluginRegistryService');
    // We loop through each plugin and ask it to register its event triggers
    const plugins = await registry.getPlugins('workflow-event-triggers');
    for (const plugin of plugins) {
      await plugin.registerWorkflowEventTriggers(this);
    }
  }

  async add(rawData) {
    const [jsonSchemaValidationService] = await this.service(['jsonSchemaValidationService']);
    const { id } = rawData;

    await jsonSchemaValidationService.ensureValid(rawData, inputSchema);

    // We allow event triggers with the same ids to be overwritten
    this.store[id] = rawData;
  }

  async findEventTrigger(id) {
    return this.store[id];
  }

  // Returns a list of all event triggers in array of this shape: [{ id, triggerType, triggerData, wf }, ...]
  async listEventTriggers() {
    return _.values(this.store);
  }
}

export default WorkflowEventTriggersRegistryService;
