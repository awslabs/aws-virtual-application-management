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

import { servicesPlugin as baseServicesPlugin } from '@aws-ee/base-api-handler';
import { servicesPlugin as eventBridgeServicesPlugin } from '@aws-ee/eventbridge-services';
import { workflowServicesPlugin } from '@aws-ee/base-workflow-core';
import { baseWfStepsPlugin } from '@aws-ee/base-workflow-steps';
import { servicesPlugin } from '@aws-ee/main-services';

import { appstreamImageBuilderWfStepsPlugin } from '@aws-ee/appstream-image-builder-workflow-steps';

const extensionPoints = {
  'service': [baseServicesPlugin, eventBridgeServicesPlugin, workflowServicesPlugin, servicesPlugin],
  'audit': [],
  'workflow-steps': [baseWfStepsPlugin, appstreamImageBuilderWfStepsPlugin],
  'workflow-templates': [],
  'workflows': [],
  'workflow-event-triggers': [],
  // --- Authorization Plugins ---/
  'user-authz': [],
  'user-role-management-authz': [], // No plugins at this point. All user-role-management authz is happening inline in 'user-roles-service'
  'json-schema-validation': [],
};

async function getPlugins(extensionPoint) {
  return extensionPoints[extensionPoint];
}

const registry = {
  getPlugins,
};

export default registry;
