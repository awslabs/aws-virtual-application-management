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
import { ServicesContainer } from '@aws-ee/base-services-container';
import { registerServices, PluginRegistryService } from '@aws-ee/base-services';

import EventBridgeSchemaService from './eventbridge-schema-service';

/**
 * This utility class helps instantiate the EventBridge schema service and call all plugins to build
 * the schema catalog.
 *
 * This class is intended to be used in scenarios where the service container does not exist and has not been initialized.
 * Example: When referencing schemas from CloudFormation template code via Serverless Framework file() variables.
 */
class SchemaContainer {
  constructor(pluginRegistry) {
    this.pluginRegistry = pluginRegistry;
  }

  /**
   * Returns a string containing the consolidated EventBridge JSONSchema for a specified schema namespace.
   *
   * @param {String} schemaNamespace A string specifying which consolidated schema to return.
   *
   * @returns {Promise<String>} An EventBridge JSONSchema string.
   */
  async getSchemas(schemaNamespace) {
    if (_.isUndefined(this.schemaCatalog)) {
      await this._buildSchemaCatalog();
    }

    return JSON.stringify(this.schemaCatalog[schemaNamespace]);
  }

  /**
   * Returns a string containing the consolidated EventBridge JSONSchema for a specified schema namespace as CloudFormation Template YAML
   *
   * @param {String} schemaNamespace A string specifying which consolidated schema to return.
   *
   * @returns {Promise<String>} An CloudFormation Template YAML string.
   */
  async getSchemasAsCloudFormationResources(schemaNamespace) {
    if (_.isUndefined(this.schemaCatalog)) {
      await this._buildSchemaCatalog();
    }

    return this._toCloudFormationResources(schemaNamespace, this.schemaCatalog[schemaNamespace]);
  }

  async _buildSchemaCatalog() {
    const container = new ServicesContainer(['settings', 'log']);
    container.register('pluginRegistryService', new PluginRegistryService(this.pluginRegistry));
    container.register('eventBridgeSchemaService', new EventBridgeSchemaService());
    await registerServices(container, this.pluginRegistry);
    await container.initServices();
    const eventBridgeSchemaService = await container.find('eventBridgeSchemaService');
    this.schemaCatalog = await eventBridgeSchemaService.getJsonSchemaCatalog();
  }

  _toCloudFormationResources(namespace, schemasArray) {
    const templateObjectSoFar = {};
    const schemaNamespace = this._firstLetterToUpperCase(namespace);
    schemasArray.forEach(schemaEntry => {
      templateObjectSoFar[`Schema${schemaNamespace}${this._firstLetterToUpperCase(schemaEntry.eventType)}`] = {
        Type: 'AWS::EventSchemas::Schema',
        Properties: {
          SchemaName: `${this._firstLetterToUpperCase(schemaEntry.eventType)}`,
          // eslint-disable-next-line no-template-curly-in-string
          RegistryName: {
            Ref: 'SolutionEventBusRegistry',
          },
          Type: 'JSONSchemaDraft4',
          Content: JSON.stringify(schemaEntry.schema),
        },
      };
    });

    const template = { Resources: templateObjectSoFar };
    return template;
  }

  _firstLetterToUpperCase(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}

export { SchemaContainer };
