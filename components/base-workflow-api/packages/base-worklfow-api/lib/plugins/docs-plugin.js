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

import path from 'path';
import workflow from '@aws-ee/base-workflow-core/lib/schema/workflow.json';
import workflowTemplate from '@aws-ee/base-workflow-core/lib/schema/workflow-template.json';
import triggerWorkflow from '@aws-ee/base-workflow-core/lib/schema/trigger-workflow.json';
import createWorkflowEventTrigger from '@aws-ee/base-workflow-core/lib/schema/create-workflow-event-trigger.json';

function getControllerConfigs(controllerConfigsSoFar) {
  const filePath = path.resolve(__dirname, '../controllers/**/*.js');
  const schemas = {
    workflow,
    workflowTemplate,
    createWorkflowEventTrigger,
    triggerWorkflow,
  };
  return [...controllerConfigsSoFar, { filePath, schemas }];
}

async function getConfiguration(configSoFar) {
  const updatedConfig = {
    ...configSoFar,
    controllerConfigs: getControllerConfigs(configSoFar.controllerConfigs),
  };
  return updatedConfig;
}

const plugin = {
  getConfiguration,
};

export default plugin;
