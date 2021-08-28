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

export default FileService;
declare class FileService {
    init(): Promise<void>;
    s3Service: any;
    ddbGeoConfig: ddbGeo.GeoDataManagerConfiguration;
    ddbGeoManager: ddbGeo.GeoDataManager;
    fileQueryIndexName: any;
    fileQueryS3UriIndexName: any;
    fileQueryLocationIndexName: any;
    fileQueryEntityTypeIsLatestIndexName: any;
    fileQuerySourceIsLatestIndexName: any;
    geohashPrecision: number;
    /**
     * Creates a new File record, with the given `datasetId`.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {string} datasetId ID of an existing Dataset.
     * @param {Object} rawData Fields to save on the newly created File.
     *
     * @returns {Promise<Object>} Newly saved File record, in a representation suitable for
     * external callers.
     */
    create(requestContext: any, datasetId: string, rawData: any): Promise<any>;
    /**
     * Lists one or many File records for a given `datasetId` including all versions of the files.
     *
     * Note that a maximum of 100 results can be returned in a single query, so this method
     * should be called with pagination (see `nextToken` below) to access more than 100 results.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {string} datasetId ID of an existing Dataset.
     * @param {number=10} maxResults Maximum number of results to return. Permitted
     * values are 1-100 (inclusive).
     * @param {string|undefined} nextToken If supplied, should be taken from the output of
     * the previous call to this method. When provided in this manner, this method returns
     * the next page of results. If omitted, then the query starts from the beginning.
     * @param {string[]=[]} fields Array of fields to include on an allow list basis.
     * If empty or not provided, all fields are included in the response by default.
     *
     * @throws {BoomError} With code "forbidden" if the principal defined in
     * `requestContext` is not authorized to perform this action.
     * @throws {BoomError} With code "badRequest" `maxResults` is not a number between 1-100.
     * @returns {Promise<Object[]>} Array of File objects. This array will be empty if either there
     * are no Files with the given `datasetId`, or if this was a paginated query (one
     * where a `nextToken` was provided) and there are no more results for that paginated session.
     */
    list(requestContext: any, datasetId: string, maxResults: number, nextToken: string | undefined, fields?: any[]): Promise<any[]>;
    /**
     * Lists one or many File records for a given `datasetId` including only the latest version of the files.
     *
     * Note that a maximum of 100 results can be returned in a single query, so this method
     * should be called with pagination (see `nextToken` below) to access more than 100 results.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {string} datasetId ID of an existing Dataset.
     * @param {number=10} maxResults Maximum number of results to return. Permitted
     * values are 1-100 (inclusive).
     * @param {string|undefined} nextToken If supplied, should be taken from the output of
     * the previous call to this method. When provided in this manner, this method returns
     * the next page of results. If omitted, then the query starts from the beginning.
     * @param {string[]=[]} fields Array of fields to include on an allow list basis.
     * If empty or not provided, all fields are included in the response by default.
     *
     * @throws {BoomError} With code "forbidden" if the principal defined in
     * `requestContext` is not authorized to perform this action.
     * @throws {BoomError} With code "badRequest" `maxResults` is not a number between 1-100.
     * @returns {Promise<Object[]>} Array of File objects. This array will be empty if either there
     * are no Files with the given `datasetId`, or if this was a paginated query (one
     * where a `nextToken` was provided) and there are no more results for that paginated session.
     */
    listLatestVersions(requestContext: any, datasetId: string, maxResults: number, nextToken: string | undefined, fields?: any[]): Promise<any[]>;
    /**
     * Lists one or many File records for a given `datasetId` and `s3Uri`, ordered descending by `createdAt`.
     *
     * Note that a maximum of 100 results can be returned in a single query, so this method
     * should be called with pagination (see `nextToken` below) to access more than 100 results.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {string} datasetId ID of an existing Dataset.
     * @param {number=10} maxResults Maximum number of results to return. Permitted
     * values are 1-100 (inclusive).
     * @param {string|undefined} nextToken If supplied, should be taken from the output of
     * the previous call to this method. When provided in this manner, this method returns
     * the next page of results. If omitted, then the query starts from the beginning.
     * @param {string[]=[]} fields Array of fields to include on an allow list basis.
     * If empty or not provided, all fields are included in the response by default.
     *
     * @throws {BoomError} With code "forbidden" if the principal defined in
     * `requestContext` is not authorized to perform this action.
     * @throws {BoomError} With code "badRequest" `maxResults` is not a number between 1-100.
     * @returns {Promise<Object[]>} Array of File objects. This array will be empty if either there
     * are no Files with the given `datasetId`, or if this was a paginated query (one
     * where a `nextToken` was provided) and there are no more results for that paginated session.
     */
    listByS3Uri(requestContext: any, datasetId: string, s3Uri: any, maxResults: number, nextToken: string | undefined, fields?: any[]): Promise<any[]>;
    /**
     * Lists one or many File records for a given `datasetId`, `origin`, and `radiusInMeters`.
     *
     * Note that unlike {@link listByS3Uri} or {@link listAll}, this method does not support pagination.
     * Instead, all applicable results are returned.
     *
     * Location of the search origin.
     * @typedef {Object} SearchOrigin
     * @property {string} latitude Latitude of search origin.
     * @property {string} longitude Longitude of search origin.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {string} datasetId ID of an existing Dataset.
     * @param {SearchOrigin} origin Location of the search origin.
     * @param {number} radiusInMeters Search radius, in meters, from `origin`.
     * @param {string[]=[]} fields Array of fields to include on an allow list basis.
     * If empty or not provided, all fields are included in the response by default.
     *
     * @throws {BoomError} With code "forbidden" if the principal defined in
     * `requestContext` is not authorized to perform this action.
     * @returns {Promise<Object[]>} Array of File objects. This array will be empty if there
     * are no Files with the given `datasetId`.
     */
    listByLocationRadius(requestContext: any, datasetId: string, origin: {
        /**
         * Latitude of search origin.
         */
        latitude: string;
        /**
         * Longitude of search origin.
         */
        longitude: string;
    }, radiusInMeters: number, fields?: any[]): Promise<any[]>;
    /**
     * Lists one or many File records for a given `datasetId`, `corner1`, and `corner2`.
     *
     * Note that unlike {@link listByS3Uri} or {@link list}, this method does not support pagination.
     * Instead, all applicable results are returned.
     *
     * Location of a Rectangle corner.
     * @typedef {Object} RectangleCorner
     * @property {string} latitude Latitude of search rectangle corner.
     * @property {string} longitude Longitude of search rectangle corner.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {string} datasetId ID of an existing Dataset.
     * @param {RectangleCorner} swCorner Location of the South West rectangle corner.
     * @param {RectangleCorner} neCorner Location of the North East rectangle corner.
     * @param {string[]=[]} fields Array of fields to include on an allow list basis.
     * If empty or not provided, all fields are included in the response by default.
     *
     * @throws {BoomError} With code "forbidden" if the principal defined in
     * `requestContext` is not authorized to perform this action.
     * @returns {Promise<Object[]>} Array of File objects. This array will be empty if there
     * are no Files with the given `datasetId`.
     */
    listByLocationRectangle(requestContext: any, datasetId: string, swCorner: {
        /**
         * Latitude of search rectangle corner.
         */
        latitude: string;
        /**
         * Longitude of search rectangle corner.
         */
        longitude: string;
    }, neCorner: {
        /**
         * Latitude of search rectangle corner.
         */
        latitude: string;
        /**
         * Longitude of search rectangle corner.
         */
        longitude: string;
    }, fields?: any[]): Promise<any[]>;
    /**
     * Gets a File record, with the given `datasetId` and `fileId`.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {string} datasetId ID of an existing Dataset.
     * @param {string} fileId ID of an existing File.
     * @param {string[]=[]} fields Array of fields to include on an allowlist basis.
     * If empty or not provided, all fields are included in the response by default.
     *
     * @throws {BoomError} With code "forbidden" if the principal defined in
     * `requestContext` is not authorized to perform this action.
     * @returns {Promise<(Object|undefined)>} If it exists, then returns the File object, in a
     * representation suitable for external callers. Else, returns undefined.
     */
    find(requestContext: any, datasetId: string, fileId: string, fields?: any[]): Promise<(any | undefined)>;
    /**
     * Gets a File record, with the given `datasetId` and `fileId`.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {string} datasetId ID of an existing Dataset.
     * @param {string} fileId ID of an existing File.
     * @param {string[]=[]} fields Array of fields to include on an allowlist basis.
     * If empty or not provided, all fields are included in the response by default.
     *
     * @throws {BoomError} With code "forbidden" if the principal defined in
     * `requestContext` is not authorized to perform this action.
     * @throws {BoomError} With code "notFound" if the File does not exist.
     * @returns {Promise<Object>} If it exists, then returns a File object, in a representation
     * suitable for external callers.
     */
    mustFind(requestContext: any, datasetId: string, fileId: string, fields?: any[]): Promise<any>;
    /**
     * Updates a File record, with the given `datasetId` and `fileId`.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {string} datasetId ID of an existing Dataset.
     * @param {string} fileId ID of an existing File.
     * @param {Object} rawData Fields to update the File with.
     * @param {boolean} igoreSchema Whether to bypass schema validation of `rawData`.
     *
     * @throws {BoomError} With code "forbidden" if the principal defined in
     * `requestContext` is not authorized to perform this action.
     * @throws {BoomError} With code "notFound" if the File does not exist or
     * has been marked as deleted.
     * @throws {BoomError} With code "badRequest" if `rawData` is in an unexpected format.
     * @throws {BoomError} With code "outdatedUpdateAttempt" if the File was updated at approximately
     * the same time by another request, and this request lost the "last write wins" race.
     * @returns {Promise<Object>} Newly updated File object, in a representation suitable for external callers.
     */
    update({ requestContext, datasetId, fileId, rawData, ignoreSchema }: any): Promise<any>;
    /**
     * Tombstones a File record, with the given `datasetId`, `fileId`, and `rev`.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {string} datasetId ID of an existing Dataset.
     * @param {string} fileId ID of an existing File.
     * @param {number} rev Revision of the File record to mark as deleted.
     *
     * @throws {BoomError} With code "forbidden" if the principal defined in
     * `requestContext` is not authorized to perform this action.
     * @throws {BoomError} With code "notFound" if the File does not exist.
     * @returns {Promise<Object>} Deleted File object, in a representation suitable for
     * external callers.
     */
    delete(requestContext: any, datasetId: string, fileId: string, rev: number): Promise<any>;
    /**
     * Creates a presigned S3 URL for a specified file ID.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {string} datasetId ID of an existing Dataset.
     * @param {string} fileId ID of an existing File.
     *
     * @throws {BoomError} With code "forbidden" if the principal defined in
     * `requestContext` is not authorized to perform this action.
     * @throws {BoomError} With code "notFound" if the File does not exist.
     * @returns {Promise<Object>} JSON serializable object that contains the presigned S3 URL to the file.
     */
    createPresignedUrl(requestContext: any, datasetId: string, fileId: string): Promise<any>;
    /**
     * Builds the metadata object for a source based on input S3 Files.
     *
     * The input files need to be specified by S3 URI and S3 Version ID because when
     * the file is uploaded, there is no guarantee that it was registered in the dataset as well.
     *
     * @param {Array<Object>} sourceFileS3Uris Array of input file entries of the form:
     * { s3Uri: <string>, versionId <string> }
     * @param {string} sourceType The source type of the entity that will upload a new file based on this metadata.
     * @param {string} sourceId The source ID of the entity that will upload a new file based on this metadata.
     * @param {string} uploadType The type of file upload used for this source data audit event.
     *
     * @returns {Promise<Object>} JSON object to be used in the parameters of an S3 client putObject request.
     */
    buildSourceS3Metadata(sourceFileS3Uris: Array<any>, sourceType: string, sourceId: string, uploadType: string): Promise<any>;
    /**
     * Adds a data audit event to a specified file.
     *
     * The input files need to be specified by S3 URI and S3 Version ID because when
     * the file is uploaded, there is no guarantee that it was registered in the dataset as well.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {string} datasetId ID of an existing Dataset.
     * @param {string} fileId ID of an existing File.
     * @param {string} sourceType The source type of the entity that uploaded a new file based on this file.
     * @param {string} sourceId The source ID of the entity that uploaded a new file based on this file.
     * @param {Array<Object>} sourceFileS3Uris Array of input file entries of the form:
     * { s3Uri: <string>, versionId <string> }
     * @param {Object} details Detailed data audit event object structured by the caller.
     *
     * @returns {Promise<Object>} Updated file object, in a representation suitable for
     * external callers.
     */
    addDataAuditProcessingOutputEvent(requestContext: any, datasetId: string, fileId: string, sourceType: string, sourceId: string, sourceFileS3Uris: Array<any>, details: any): Promise<any>;
    /**
     * Fetches S3 details about a File with the given `datasetId` and `fileId`.
     *
     * Location object, encapsulating latitude and longitude.
     * @typedef {Object} FileS3Details
     * @property {string} datasetS3Bucket S3 bucket name this File resides in.
     * @property {string} fileS3Key S3 key of this File.
     * @property {string} fileObjectVersionId S3 object version id of this File.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {string} datasetId ID of an existing Dataset.
     * @param {string} fileId ID of an existing File.
     *
     * @throws {BoomError} With code "notFound" if the File does not exist.
     * @returns {Promise<FileS3Details>}
     */
    getS3Details(requestContext: any, datasetId: string, fileId: string): Promise<{
        /**
         * S3 bucket name this File resides in.
         */
        datasetS3Bucket: string;
        /**
         * S3 key of this File.
         */
        fileS3Key: string;
        /**
         * S3 object version id of this File.
         */
        fileObjectVersionId: string;
    }>;
}
import * as ddbGeo from "@joenye/dynamodb-geo";
