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

export default FileSchemasService;
declare class FileSchemasService {
    init(): Promise<void>;
    fileSchemas: any[];
    /**
     * Lists solution-wide file schemas.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     *
     * @throws {BoomError} With code "forbidden" if the principal defined in
     * `requestContext` is not authorized to perform this action.
     * @returns {Promise<Object[]>} FileSchemas array. Has structure defined
     * by {@link ../schema/file-schemas/file-schemas.json}.
     */
    list(requestContext: any): Promise<any[]>;
    /**
     * Ensures the provided `schemaAttributes` and `dbFields` are valid, for the given
     * `schemaId`.
     *
     * @param {Object<string, any>} requestedDbFields Fields object, containing File fields to persist.
     *
     * @throws {BoomError} with code "badRequest" if `schemaAttributes` are invalid.
     */
    ensureValid(requestedDbFields: {
        [x: string]: any;
    }): Promise<void>;
}
