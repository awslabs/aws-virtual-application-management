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
import inputSchema from '../schema/workflow.json';

class WorkflowRegistryService extends Service {
  constructor() {
    super();
    this.dependency(['jsonSchemaValidationService', 'pluginRegistryService']);
  }

  async init() {
    await super.init();
    this.store = []; // an array of objects of this shape: { key: <id_ver>, value: { definition } }
    const registry = await this.service('pluginRegistryService');
    // We loop through each plugin and ask it to register its workflows
    const plugins = await registry.getPlugins('workflows');
    for (const plugin of plugins) {
      await plugin.registerWorkflows(this);
    }
  }

  async add({ definition, yaml }) {
    const [jsonSchemaValidationService] = await this.service(['jsonSchemaValidationService']);
    const { id, v } = definition;
    const existing = await this.findWorkflow({ id, v });

    if (existing) {
      throw this.boom.badRequest(
        `You tried to register a workflow, but a workflow with the same id "${id}" and version "${v}" already exists`,
        true,
      );
    }

    if (!_.isEmpty(yaml)) {
      throw this.boom.badRequest(
        `The 'yaml' property is no longer supported. Use 'definition' instead when you register the workflow definitions.`,
      );
    }

    await jsonSchemaValidationService.ensureValid(definition, inputSchema);

    const key = this.encodeId({ id, v });
    this.store.push({ key, value: { definition } });
  }

  async findWorkflow({ id, v }) {
    const key = this.encodeId({ id, v });
    const entry = _.find(this.store, ['key', key]);
    return entry ? entry.value : undefined;
  }

  // Returns a list of all workflow in array of this shape: [{ id, v, definition }, ...]
  async listWorkflows() {
    return _.map(this.store, item => {
      const { definition } = item.value;
      const { id, v } = definition;
      return { id, v, definition };
    });
  }

  // private
  encodeId({ id, v }) {
    return `${id}_${v}`;
  }
}

export default WorkflowRegistryService;
