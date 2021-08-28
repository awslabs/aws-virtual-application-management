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

import { WorkflowDraftService, WorkflowTriggerService, StepTemplateService } from '@aws-ee/base-workflow-core';
import AppstreamService from '../appstream/appstream-service';
import AppstreamAuthzService from '../appstream/appstream-authz-service';
import { AppstreamUtilService } from '../appstream/appstream-util-service';
import { DynamicCatalogService } from '../appstream/dynamic-catalog-service';
import GroupService from '../group-service';
import GroupAuthzService from '../group-authz-service';
import GroupAccessService from '../appstream/group-access-service';

const settingKeys = {
  tablePrefix: 'dbPrefix',
};

/**
 * Registers the services needed by the workflow loop runner lambda function
 * @param container An instance of ServicesContainer to register services to
 * @param pluginRegistry A registry that provides plugins registered by various addons for the specified extension point.
 *
 * @returns {Promise<void>}
 */
// eslint-disable-next-line no-unused-vars
async function registerServices(container, pluginRegistry) {
  container.register('appstreamService', new AppstreamService());
  container.register('appstreamAuthzService', new AppstreamAuthzService());
  container.register('appstreamUtilService', new AppstreamUtilService());
  container.register('dynamicCatalogService', new DynamicCatalogService());
  container.register('groupService', new GroupService());
  container.register('groupAuthzService', new GroupAuthzService());
  container.register('stepRegistryService', new StepTemplateService());
  container.register('workflowTriggerService', new WorkflowTriggerService());
  container.register('workflowDraftService', new WorkflowDraftService());
  container.register('groupAccessService', new GroupAccessService());
}

// eslint-disable-next-line no-unused-vars
function getStaticSettings(existingStaticSettings, settings, pluginRegistry) {
  const staticSettings = {
    ...existingStaticSettings,
  };

  // Register all dynamodb table names used by the base rest api addon
  const tablePrefix = settings.get(settingKeys.tablePrefix);
  const table = (key, suffix) => {
    staticSettings[key] = `${tablePrefix}-${suffix}`;
  };
  table('dbAppstreamImages', 'AppstreamImages');
  table('dbDynamicCatalogs', 'DynamicCatalogs');
  table('dbGroupAccess', 'GroupAccess');

  return staticSettings;
}

const plugin = {
  getStaticSettings,
  registerServices,
};

export default plugin;
