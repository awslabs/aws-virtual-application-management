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
import Ajv from 'ajv';
import _ from 'lodash';

/**
 * The JSON Schema Validation Service provides utilities for validating JSON
 * Schema. It also provides an extension point ("json-schema-validation")
 * for plugins to contribute JSON schemas.
 */
class JsonSchemaValidationService extends Service {
  constructor() {
    super();
    this.dependency(['pluginRegistryService']);
    // Add base schemas to this object
    this.schemas = {};
  }

  /**
   * @throws a boom.badRequest with a payload of validation errors if objectToValidate has validation errors.
   */
  async ensureValid(objectToValidate, schemaToValidateAgainst) {
    const errors = await this.getValidationErrors(objectToValidate, schemaToValidateAgainst);
    if (errors.length > 0) {
      throw this.boom.badRequest('Input has validation errors', true).withPayload(
        {
          validationErrors: errors,
        },
        true,
      );
    }
  }

  /**
   * @returns an array of validation errors. If there are no errors, getValidationErrors will return an empty array.
   */
  async getValidationErrors(objectToValidate, schemaToValidateAgainst) {
    const ajv = new Ajv({ allErrors: true });
    ajv.validate(schemaToValidateAgainst, objectToValidate);
    return ajv.errors || [];
  }

  /**
   * Get method responsible for returning the requested schema
   *
   * @param schemaName The name of the schema to return
   *   *
   * @param args Additional arguments to pass to the plugins for the specified extension point.
   *
   * @returns {Promise<{*}>} A promise that resolves to schema to use.
   */
  async getSchema(schemaName, ...args) {
    const schema = this.schemas[schemaName];

    const pluginRegistryService = await this.service('pluginRegistryService');

    // Give each plugin a chance to update the schema
    const finalSchema = await pluginRegistryService.visitPlugins(
      'json-schema-validation',
      'getSchema',
      {
        payload: schema,
        pluginInvokerFn: async (pluginPayload, plugin, method, ...pluginArgs) =>
          plugin[method](schemaName, pluginPayload, ...pluginArgs),
      },
      ...args,
    );

    // If the schema is undefined ajv will validate anything. Rather than that
    // indicate that there's a misconfiguration.
    if (_.isEmpty(finalSchema)) {
      throw this.boom.badRequest(`Failed to find the schema ${schemaName}`, true);
    }

    return finalSchema;
  }
}

export default JsonSchemaValidationService;
