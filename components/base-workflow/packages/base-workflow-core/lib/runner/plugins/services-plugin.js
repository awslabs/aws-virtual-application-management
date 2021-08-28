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

import {
  AwsService,
  DbService,
  JsonSchemaValidationService,
  InputManifestValidationService,
  S3Service,
  IamService,
  LockService,
  PluginRegistryService,
  AuditWriterService,
  AuthorizationService,
  UserAuthzService,
  UserService,
} from '@aws-ee/base-services';

import StepRegistryService from '../../workflow/step/step-registry-service';
import StepTemplateService from '../../workflow/step/step-template-service';
import WorkflowTemplateRegistryService from '../../workflow/workflow-template-registry-service';
import WorkflowTemplateService from '../../workflow/workflow-template-service';
import WorkflowService from '../../workflow/workflow-service';
import WorkflowRegistryService from '../../workflow/workflow-registry-service';
import WorkflowEventTriggersRegistryService from '../../workflow/workflow-event-triggers-registry-service';
import WorkflowEventTriggersService from '../../workflow/workflow-event-triggers-service';
import WorkflowInstanceService from '../../workflow/workflow-instance-service';
import WorkflowTriggerService from '../../workflow/workflow-trigger-service';

const settingKeys = {
  tablePrefix: 'dbPrefix',
};

/**
 * Registers the services needed by the lambda function.
 *
 * @param container An instance of ServicesContainer to register services to
 * @param pluginRegistry A registry that provides plugins registered by various addons for the specified extension point.
 *
 * @returns {Promise<void>}
 */
async function registerServices(container, pluginRegistry) {
  container.register('aws', new AwsService());
  container.register('dbService', new DbService(), { lazy: false });
  container.register('jsonSchemaValidationService', new JsonSchemaValidationService());
  container.register('inputManifestValidationService', new InputManifestValidationService());
  container.register('s3Service', new S3Service());
  container.register('iamService', new IamService());
  container.register('auditWriterService', new AuditWriterService());
  container.register('pluginRegistryService', new PluginRegistryService(pluginRegistry), { lazy: false });
  container.register('lockService', new LockService());
  container.register('userService', new UserService());
  container.register('stepRegistryService', new StepRegistryService());
  container.register('stepTemplateService', new StepTemplateService());
  container.register('workflowTemplateService', new WorkflowTemplateService());
  container.register('workflowTemplateRegistryService', new WorkflowTemplateRegistryService());
  container.register('workflowService', new WorkflowService());
  container.register('workflowRegistryService', new WorkflowRegistryService());
  container.register('workflowEventTriggersRegistryService', new WorkflowEventTriggersRegistryService());
  container.register('workflowEventTriggersService', new WorkflowEventTriggersService());
  container.register('workflowInstanceService', new WorkflowInstanceService());
  container.register('workflowTriggerService', new WorkflowTriggerService());

  // Authorization Services from base addon
  container.register('authorizationService', new AuthorizationService());
  container.register('userAuthzService', new UserAuthzService());
}

/**
 * Registers static settings required by the lambda function.
 *
 * @param existingStaticSettings An existing static settings plain javascript object containing settings as key/value contributed by other plugins
 * @param settings Default instance of settings service that resolves settings from environment variables
 * @param pluginRegistry A registry that provides plugins registered by various addons for the specified extension point
 *
 * @returns {Promise<*>} A promise that resolves to static settings object
 */
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
  table('dbUsers', 'Users');
  table('dbLocks', 'Locks');
  table('dbStepTemplates', 'StepTemplates');
  table('dbWorkflowTemplates', 'WorkflowTemplates');
  table('dbWorkflowTemplateDrafts', 'WorkflowTemplateDrafts');
  table('dbWorkflowDrafts', 'WorkflowDrafts');
  table('dbWorkflows', 'Workflows');
  table('dbWorkflowInstances', 'WorkflowInstances');
  table('dbWorkflowEventTriggers', 'WorkflowEventTriggers');

  return staticSettings;
}

const plugin = {
  getStaticSettings,
  // getLoggingContext, // not implemented, the default behavior provided by addon-base is sufficient
  // registerSettingsService, // not implemented, the default behavior provided by addon-base is sufficient
  // registerLoggerService, // not implemented, the default behavior provided by addon-base is sufficient
  registerServices,
};

export default plugin;
