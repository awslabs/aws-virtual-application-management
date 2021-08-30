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

export default DatasetService;
declare class DatasetService {
    static get overallStatuses(): {
        ACTIVE: string;
        UNREACHABLE: string;
        DELETED: string;
    };
    static get batchProcessingStatuses(): {
        IDLE: string;
        RECONCILING: string;
        RECONCILING_ERRORED: string;
        UPDATING_DATASET_SCOPED_LIFECYCLE_POLICIES: string;
        UPDATING_DATASET_SCOPED_LIFECYCLE_POLICIES_ERRORED: string;
    };
    init(): Promise<void>;
    aws: any;
    s3Service: any;
    queryIndexName: any;
    queryS3BucketIndexName: any;
    /**
     * Creates a new Dataset record.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {Object} rawData Fields to save on the newly created Dataset.
     *
     * @throws {BoomError} With code "forbidden" if the principal defined in
     * `requestContext` is not authorized to perform this action.
     * @throws {BoomError} With code "badRequest" if `rawData` is in an unexpected format.
     * @returns {Promise<Object>} Newly saved Dataset record, in a representation suitable for
     * external callers.
     */
    create(requestContext: any, rawData: any): Promise<any>;
    /**
     * Lists one or many Dataset records.
     *
     * Note that a maximum of 100 results can be returned in a single query, so this method
     * should be called with pagination (see `nextToken` below) to access more than 100 results.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {number=10} maxResults Maximum number of results to return. Permitted
     * values are 1-100 (inclusive).
     * @param {string[]=[]} fields Array of fields to include on an allowlist basis.
     * If empty or not provided, all fields are included in the response by default.
     * @param {string|undefined} nextToken If supplied, should be taken from the output of
     * the previous call to this method. When provided in this manner, this method returns
     * the next page of results. If omitted, then the query starts from the beginning.
     *
     * @throws {BoomError} With code "forbidden" if the principal defined in
     * `requestContext` is not authorized to perform this action.
     * @throws {BoomError} With code "badRequest" `maxResults` is not a number between 1-100.
     * @returns {Promise<Object[]>} Array of Dataset objects. This array will be empty if either there
     * are no Datasets, or if this was a paginated query (one where a `nextToken` was provided)
     * and there are no more results for that pagination session.
     */
    list(requestContext: any, maxResults: number, nextToken?: string | undefined, fields?: any[]): Promise<any[]>;
    /**
     * Gets a Dataset record, with the given `datasetId`.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {string} datasetId ID of an existing Dataset.
     * @param {string[]=[]} fields Array of fields to include on an allowlist basis.
     * If empty or not provided, all fields are included in the response by default.
     *
     * @throws {BoomError} With code "forbidden" if the principal defined in
     * `requestContext` is not authorized to perform this action.
     * @returns {Promise<(Object|undefined)>} If it exists, then returns the Dataset object, in a
     * representation suitable for external callers. Else, returns undefined.
     */
    find(requestContext: any, datasetId: string, fields?: any[]): Promise<(any | undefined)>;
    /**
     * Returns a Dataset ID inferred from a file path depending on the specified data source.
     * Currently supports the following data sources: "s3".
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {string} dataSource Storage strategy for the dataset (e.g. "s3").
     * @param {Object} params Parameters that identify the file path in the data source
     * (e.g. for "s3": {"bucket": "myBucket", "key": "filePrefix/fileKey"})
     *
     * @throws {BoomError} With code "forbidden" if the principal defined in
     * `requestContext` is not authorized to perform this action.
     * @throws {BoomError} With code "badRequest" data source does not support find by file path.
     * @returns {Promise<(String|undefined)>} If there is a dataset registered at the path that contains the file,
     * then it returns the Dataset ID.
     */
    findByFilePath(requestContext: any, dataSource: string, params: any): Promise<(string | undefined)>;
    /**
     * Gets a Dataset record, with the given `datasetId`.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {string} datasetId ID of an existing Dataset.
     * @param {string[]=[]} fields Array of fields to include on an allowlist basis.
     * If empty or not provided, all fields are included in the response by default.
     *
     * @throws {BoomError} With code "forbidden" if the principal defined in
     * `requestContext` is not authorized to perform this action.
     * @throws {BoomError} With code "notFound" if the Dataset does not exist.
     * @returns {Promise<Object>} If it exists, then returns a Dataset object, in a representation
     * suitable for external callers.
     */
    mustFind(requestContext: any, datasetId: string, fields?: any[]): Promise<any>;
    /**
     * Updates a Dataset record, with the given `datasetId`.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {string} datasetId ID of an existing Dataset.
     * @param {Object} rawData Fields to update the Dataset with.
     * @param {boolean} igoreSchema Whether to bypass schema validation of `rawData`.
     *
     * @throws {BoomError} With code "forbidden" if the principal defined in
     * `requestContext` is not authorized to perform this action.
     * @throws {BoomError} With code "notFound" if the Dataset does not exist or
     * has been marked as deleted.
     * @throws {BoomError} With code "badRequest" if `rawData` is in an unexpected format.
     * @throws {BoomError} With code "outdatedUpdateAttempt" if the Dataset was updated at
     * approximately the same time by another request, and this request lost the "last write wins" race.
     * @returns {Promise<Object>} Newly updated Dataset object, in a representation suitable for external callers.
     */
    update(requestContext: any, datasetId: string, rawData: any, ignoreSchema?: boolean): Promise<any>;
    /**
     * Tombstones a Dataset record, with the given `datasetId` and `rev`.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {string} datasetId ID of an existing Dataset.
     * @param {number} rev Revision of the Dataset record to mark as deleted.
     *
     * @throws {BoomError} With code "forbidden" if the principal defined in
     * `requestContext` is not authorized to perform this action.
     * @throws {BoomError} With code "notFound" if the Dataset does not exist.
     * @returns {Promise<Object>} Deleted Dataset object, in a representation suitable for
     * external callers.
     */
    delete(requestContext: any, datasetId: string, rawData: any): Promise<any>;
    /**
     * Creates a presigned post URL and form fields for use in uploading objects to S3 from the browser.
     * Note: In order for browser uplaod to work, the destination bucket will need to have an appropriate CORS policy configured.
     * @see https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutBucketCors.html
     *
     * @typedef { credentials, s3Key, bucket } TemporaryCredentials
     * @param {Object} requestContext the request context provided by @aws-ee/base-services-container/lib/request-context.
     * @param {string} datasetId the ID of the dataset in which the uploaded files should be shored.
     * @param {string} filename the filename that will be used for the upload.
     *
     * @returns {Promise<TemporaryCredentials>} the url and fields to use when performing the upload
     */
    createTemporaryUploadCredentials(requestContext: any, datasetId: string, filename: string): Promise<any>;
    assertOverallStatus(requestContext: any, datasetId: any, status: any): Promise<void>;
    assertBatchProcessingStatus(requestContext: any, datasetId: any, status: any): Promise<void>;
    getS3Details(requestContext: any, datasetId: any): Promise<{
        datasetS3Bucket: any;
        datasetS3KeyPrefix: any;
    }>;
}
