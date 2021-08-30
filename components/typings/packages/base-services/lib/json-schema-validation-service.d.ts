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

import { Service } from "@aws-ee/base-services-container";

export default JsonSchemaValidationService;
/**
 * The JSON Schema Validation Service provides utilities for validating JSON
 * Schema. It also provides an extension point ("json-schema-validation")
 * for plugins to contribute JSON schemas.
 */
declare class JsonSchemaValidationService extends Service {
    schemas: {};
    /**
     * @throws a boom.badRequest with a payload of validation errors if objectToValidate has validation errors.
     */
    ensureValid(objectToValidate: any, schemaToValidateAgainst: any): Promise<void>;
    /**
     * @returns an array of validation errors. If there are no errors, getValidationErrors will return an empty array.
     */
    getValidationErrors(objectToValidate: any, schemaToValidateAgainst: any): Promise<any>;
    /**
     * Get method responsible for returning the requested schema
     *
     * @param schemaName The name of the schema to return
     *   *
     * @param args Additional arguments to pass to the plugins for the specified extension point.
     *
     * @returns {Promise<{*}>} A promise that resolves to schema to use.
     */
    getSchema(schemaName: any, ...args: any[]): Promise<{}>;
}
