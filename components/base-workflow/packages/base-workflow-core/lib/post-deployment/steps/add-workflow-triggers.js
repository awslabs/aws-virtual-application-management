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

class AddWorkflowTriggers extends Service {
  constructor() {
    super();
    this.dependency(['deploymentStoreService', 'workflowEventTriggersService', 'workflowEventTriggersRegistryService']);
  }

  async init() {
    await super.init();
  }

  async execute() {
    const [registryService] = await this.service(['workflowEventTriggersRegistryService']);

    const triggers = await registryService.listEventTriggers();

    for (const trigger of triggers) {
      const id = trigger.id;
      const definitionStr = JSON.stringify(trigger);
      const existingItem = await this._findDeploymentItem({ id });

      if (existingItem) {
        this.log.info(`Skip workflow [${id}]`);
      } else {
        this.log.info(`Add/Update workflow [${id}]`);
        await this._createTrigger(trigger);
        await this._createDeploymentItem({ id, definitionStr });
      }
    }
  }

  async _findDeploymentItem({ id }) {
    const [deploymentStore] = await this.service(['deploymentStoreService']);
    return deploymentStore.find({ type: 'workflow-trigger', id });
  }

  async _createTrigger(triggerDefinition) {
    const [service] = await this.service(['workflowEventTriggersService']);
    const requestContext = getSystemRequestContext();
    await service.create(requestContext, triggerDefinition);
  }

  async _createDeploymentItem({ id, definitionStr }) {
    const [deploymentStore] = await this.service(['deploymentStoreService']);
    return deploymentStore.createOrUpdate({ type: 'workflow-trigger', id, value: definitionStr });
  }
}

export default AddWorkflowTriggers;
