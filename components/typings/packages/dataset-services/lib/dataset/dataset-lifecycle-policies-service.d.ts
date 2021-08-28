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

export default DatasetLifecyclePoliciesService;
declare class DatasetLifecyclePoliciesService {
    MAX_OBJECT_TAGS_PER_OBJECT: number;
    MAX_FILE_SCOPED_POLICIES_PER_FILE: number;
    MAX_DATASET_SCOPED_POLICIES_PER_FILE: number;
    DATASET_LIFECYCLE_POLICY_OBJECT_TAG_KEY: string;
    init(): Promise<void>;
    s3Client: any;
    s3Service: any;
    lambdaClient: any;
    datasetService: any;
    datasetPoliciesService: any;
    fileService: any;
    authorizationService: any;
    validationService: any;
    /**
     * Creates a new Lifecycle Policy, for the Dataset with the given `datasetId`.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {string} datasetId ID of an existing Dataset.
     * @param {Object} rawData Fields to save on a newly created Lifecycle Policy.
     *
     * @throws {BoomError} With code "forbidden" if the principal defined in
     * `requestContext` is not authorized to perform this action.
     * @throws {BoomError} With code "badRequest" if `rawData` is in an unexpected format.
     * @throws {BoomError} With code "internalError" if an S3 service limit has been reached.
     * @returns {Promise<Object>} Newly created Lifecycle Policy record.
     */
    create(requestContext: any, datasetId: string, rawData: any): Promise<any>;
    /**
     * Lists all Lifecycle Policies for the Dataset.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {string} datasetId ID of an existing Dataset.
     */
    list(requestContext: any, datasetId: string): Promise<any>;
    /**
     * Activates the Lifecycle Policy with ID `policyId` on the File with Dataset ID
     * `datasetId` and File ID `fileId`.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {string} datasetId ID of an existing Dataset.
     * @param {string} fileId ID of the File to activate the Policy on.
     * @param {string} policyId ID of the Lifecycle Policy that is currently
     * deactivated for this File, to activated.
     */
    activateFileScoped(requestContext: any, datasetId: string, fileId: string, policyId: string): Promise<void>;
    /**
     * Activates a Lifecycle Policy on the Dataset with ID `datasetId`.
     *
     * This activates the Policy on all Files in the Dataset that do not have
     * custom Policies. These are Files that have not deactivated any
     * Dataset-scoped policies, or activated any File-scoped policies.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {string} datasetId ID of an existing Dataset.
     * @param {string} policyId ID of the Lifecycle Policy to activate.
     */
    activateDatasetScoped(requestContext: any, datasetId: string, policyId: string): Promise<void>;
    /**
     * Deactivates the Lifecycle Policy with ID `policyId` on the File with Dataset ID
     * `datasetId` and File ID `fileId`.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {string} datasetId ID of an existing Dataset.
     * @param {string} fileId ID of the File to deactivate the Policy on.
     * @param {string} policyId ID of the Lifecycle Policy that is currently
     * activated for this File, to deactivate.
     */
    deactivateFileScoped(requestContext: any, datasetId: string, fileId: string, policyId: string): Promise<void>;
    /**
     * Deactivates a Lifecycle Policy on the Dataset with ID `datasetId`.
     *
     * This deactivates the Policy on all Files in the Dataset that do not have
     * custom Policies. These are Files that have not deactivated any
     * Dataset-scoped policies, or activated any File-scoped policies.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {string} datasetId ID of an existing Dataset.
     * @param {string} policyId ID of the Lifecycle Policy to deactivate.
     */
    deactivateDatasetScoped(requestContext: any, datasetId: string, policyId: string): Promise<void>;
    /**
     * Checks if Lifecycle Policy with ID `policyId` is activated for Dataset
     * with ID `datasetId`.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {string} datasetId ID of an existing Dataset.
     * @param {string} policyId ID of an existing Lifecycle Policy.
     *
     * @returns {boolean}
     */
    isActivatedForDataset(requestContext: any, datasetId: string, policyId: string): boolean;
    /**
     * Checks if Lifecycle Policy with ID `policyId` is activated for File
     * with ID `fileId` and Dataset ID `datasetId`.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {string} datasetId ID of an existing Dataset.
     * @param {string} fileId ID of an existing File.
     * @param {string} policyId ID of an existing Lifecycle Policy.
     *
     * @returns {boolean}
     */
    isActivatedForFile(requestContext: any, datasetId: string, fileId: string, policyId: string): boolean;
    /**
     * Deletes a Lifecycle Policy, with the given `policyId`.
     *
     * We use a long-running task to process every file to ensure deletion of tags
     * before we can remove the policy from the dataset bucket's lifecycle configuration
     * and the Policy entity in the database.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {string} datasetId ID of an existing Dataset.
     * @param {Object} policyId ID of the lifeycle policy to delete.
     *
     */
    delete(requestContext: any, datasetId: string, policyId: any): Promise<void>;
}
