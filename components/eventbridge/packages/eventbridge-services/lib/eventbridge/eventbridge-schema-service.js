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
import { SOLUTION_JSON_SCHEMA_NAMESPACE } from './constants';
import commonSchemaTemplate from '../schema/eventbridge/eventbus-common-template.json';

/**
 * The EventBridge Schema Service builds schema but then calls plugins in the
 * eventbridge schema extension point allowing them add new detail types
 * and schema parts in the "definitions" part of the solution-wide events schema.
 */
class EventBridgeSchemaService extends Service {
  constructor() {
    super();
    this.dependency(['pluginRegistryService']);
  }

  /**
   * Get method responsible for returning the solution-wide schema.
   *
   * @returns {Promise<{*}>} A promise that resolves to the solution-wide schema to use.
   */
  async getJsonSchemaCatalog() {
    const pluginRegistryService = await this.service('pluginRegistryService');

    // Give each plugin a chance to contribute to the schema
    const detailDefinitionMap = await pluginRegistryService.visitPlugins('eventbridge', 'getDetailSchemas', {
      payload: {},
      pluginInvokerFn: async (pluginPayload, plugin, method, ...pluginArgs) => {
        await plugin[method](pluginPayload);
        return plugin[method](pluginPayload, ...pluginArgs);
      },
    });

    // This object will contain all the schema definitions for each schema namespace
    const schemaCollection = {};

    // Initialize the solution-wide schema namespace
    schemaCollection[SOLUTION_JSON_SCHEMA_NAMESPACE] = [];

    Object.keys(detailDefinitionMap).forEach(key => {
      const detailTypeSchemaPart = detailDefinitionMap[key];

      // If there is no namespace override in the extension, default to the solution-wide schema namespace
      const schemaNamespace = detailDefinitionMap[key].schemaNamespace || SOLUTION_JSON_SCHEMA_NAMESPACE;

      // If this namespace override is new, initialize the namespace with a blank schema
      if (_.isUndefined(schemaCollection[schemaNamespace])) {
        schemaCollection[schemaNamespace] = [];
      }

      const newSchema = _.cloneDeep(commonSchemaTemplate);
      newSchema.definitions = _.merge(newSchema.definitions, detailTypeSchemaPart.detailSchema.definitions || {});
      newSchema.properties.detail = detailTypeSchemaPart.detailSchema.detail;
      newSchema.properties.detailType.enum = [detailTypeSchemaPart.detailType];

      schemaCollection[schemaNamespace].push({ eventType: key, schema: newSchema });
    });

    return schemaCollection;
  }
}

export default EventBridgeSchemaService;
