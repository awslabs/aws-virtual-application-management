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

/**
 * Converts the DynamoDB representation of an entity in the Datasets table into
 * a representation suitable for external callers.
 *
 * This is useful because certain fields are written to DynamoDB for performance
 * reasons (e.g. composite keys used as range keys for GSIs) or to enable 1:N
 * relationships in a single table (e.g. `entityId`).
 *
 * This method ensures a consistent "id" field is used instead of "entityId", and
 * that certain fields callers shouldn't care about seeing are omitted.
 *
 * @param {object} rawDb Entity as stored in the Datasets table in DynamoDB.
 * @param {string[]=[]} fields Array of fields to include on an allowlist basis.
 * If empty or not provided, all fields are included in the response by default.
 *
 * @returns {object} Entity `rawDb` in a representation suitable for external callers.
 */
export function dbObjectToExternalObject(rawDb: object, fields?: any[]): object;
export function parseS3Uri(s3Uri: any): {
    bucket: string;
    key: string;
};
