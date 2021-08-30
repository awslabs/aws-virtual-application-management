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

export const META_DATASET_ID: "dataset-id";
export const META_SCHEMA_ID: "schema-id";
export const META_SCHEMA_DB_FIELD_KEY: "schema-db-field-key";
export const META_SCHEMA_ATTRIBUTES: "schema-attributes";
export const META_MIME_TYPE: "mime-type";
export const META_SOURCE_UPLOAD_TYPE: "source-upload-type";
export const META_SOURCE_ID: "source-id";
export const META_SOURCE_TYPE: "source-type";
export const META_SOURCE_FILE_S3_URIS: "source-file-s3-uris";
export const SOURCE_HEADER_DATASET_ID: string;
export const SOURCE_HEADER_SCHEMA_ID: string;
export const SOURCE_HEADER_SCHEMA_DB_FIELD_KEY: string;
export const SOURCE_HEADER_SCHEMA_ATTRIBUTES: string;
export const SOURCE_HEADER_MIME_TYPE: string;
export const SOURCE_HEADER_SOURCE_UPLOAD_TYPE: string;
export const SOURCE_HEADER_SOURCE_ID: string;
export const SOURCE_HEADER_SOURCE_TYPE: string;
export const SOURCE_HEADER_SOURCE_FILE_S3_URIS: string;
export const EVENTBRIDGE_SCHEMA_NAMESPACE: "solution";
export const EVENT_TYPE_S3_PUT_OBJECT: "s3PutObject";
export const LOCK_ATTEMPTS: 3;
export const LOCK_EXPIRE_IN: 5;
export const DATE_TIME_PROPERTY_SCHEMA: {
    type: string;
    title: string;
    format: string;
};
export const LOCATION_PROPERTY_SCHEMA: {
    type: string;
    title: string;
    properties: {
        latitude: {
            type: string;
            title: string;
            minimum: number;
            maximum: number;
        };
        longitude: {
            type: string;
            title: string;
            minimum: number;
            maximum: number;
        };
    };
    dependencies: {
        latitude: string[];
        longitude: string[];
    };
};
export const WIDTH_HEIGHT_RESOLUTION_PROPERTY_SCHEMA: {
    type: string;
    title: string;
    pattern: string;
};
export const FILE_SOURCE_TYPE_USER: "user";
export const FILE_SOURCE_TYPE_WORKFLOW: "workflow";
export const UPLOAD_TYPE_WORKFLOW: "workflow-processing";
export const UPLOAD_TYPE_DIRECT_UI: "direct-ui-upload";
