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

import EventBridgeService from '../eventbridge/eventbridge-service';
import EventBridgeSchemaService from '../eventbridge/eventbridge-schema-service';

/**
 * Registers the services provided by this component.
 *
 * @param container An instance of ServicesContainer to register services to
 * @param pluginRegistry A registry that provides plugins registered by various components for the specified extension point.
 *
 * @returns {Promise<void>}
 */
async function registerServices(container, _pluginRegistry) {
  container.register('eventBridgeService', new EventBridgeService());
  container.register('eventBridgeSchemaService', new EventBridgeSchemaService());
}

const plugin = {
  registerServices,
};

export default plugin;
