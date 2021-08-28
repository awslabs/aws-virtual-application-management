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

import { Service } from '@aws-ee/base-services-container';
import { getSystemRequestContext } from '@aws-ee/base-services';

class AddStepTemplates extends Service {
  constructor() {
    super();
    this.dependency(['deploymentStoreService', 'stepTemplateService', 'stepRegistryService']);
  }

  async init() {
    await super.init();
  }

  async execute() {
    const [registryService] = await this.service(['stepRegistryService']);

    // steps = [ { id, v, definition, implClass }]
    const steps = await registryService.listSteps();

    for (const step of steps) {
      const { id, v, definition } = step;
      const encodedId = `${id}-${v}`;
      const definitionStr = JSON.stringify(definition);
      const existingItem = await this.findDeploymentItem({ id: encodedId });

      if (existingItem && definitionStr === existingItem.value) {
        this.log.info(`Skip step template [${id}] v${v} "${step.definition.title}"`);
      } else {
        this.log.info(`Add/Update step template [${id}] v${v} "${step.definition.title}"`);
        await this.createVersion(definition);
        await this.createDeploymentItem({ encodedId, definitionStr });
      }
    }
  }

  async findDeploymentItem({ id }) {
    const [deploymentStore] = await this.service(['deploymentStoreService']);
    return deploymentStore.find({ type: 'step-template', id });
  }

  async createDeploymentItem({ encodedId, definitionStr }) {
    const [deploymentStore] = await this.service(['deploymentStoreService']);

    return deploymentStore.createOrUpdate({ type: 'step-template', id: encodedId, value: definitionStr });
  }

  async createVersion(definition) {
    const [stepTemplateService] = await this.service(['stepTemplateService']);
    const { id, v } = definition;
    const requestContext = getSystemRequestContext();
    const existing = await stepTemplateService.findVersion(requestContext, { id, v, fields: [] });

    if (existing) {
      const data = { ...definition, rev: existing.rev };
      return stepTemplateService.updateVersion(requestContext, data);
    }
    return stepTemplateService.createVersion(requestContext, definition);
  }
}

export default AddStepTemplates;
