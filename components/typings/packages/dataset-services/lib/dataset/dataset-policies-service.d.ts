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

export default DatasetPoliciesService;
/**
 * Service for storing Dataset Policies.
 *
 * This service provides CRUD functionality for Dataset Policies,
 * which are all associated with a Dataset. It's expected that
 * higher-level services will leverage these as common containers
 * for storing metadata about policies.
 *
 * It's therefore not expected that this service will be directly invoked
 * by external callers, so input validation, audit, or permission checks
 * are not found here.
 */
declare class DatasetPoliciesService {
    static get policyStatuses(): {
        DEACTIVATED: string;
        DELETING: string;
        DELETING_ERRORED: string;
        DATASET_SCOPE_ACTIVATING: string;
        DATASET_SCOPE_ACTIVATED: string;
        DATASET_SCOPE_ACTIVATING_ERRORED: string;
        DATASET_SCOPE_DEACTIVATING: string;
        DATASET_SCOPE_DEACTIVATING_ERRORED: string;
    };
    init(): Promise<void>;
    fileQueryIndexName: any;
    datasetService: any;
    /**
     * Creates a new Policy with type given by `rawData.type`.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {string} datasetId ID of an existing Dataset.
     * @param {string} policyId ID of the Policy to create.
     * @param {Object} rawData Fields to save on a newly created Dataset Policy.
     *
     * @returns {Promise<Object>} Newly created Policy record.
     */
    create(requestContext: any, datasetId: string, policyId: string, { type, detail }: any): Promise<any>;
    /**
     * Lists all Policy records (irrespective of type) for a given `datasetId`.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {string} datasetId ID of an existing Dataset.
     * @param {string[]=[]} fields Array of fields to include on an allow list basis.
     * If empty or not provided, all fields are included in the response by default.
     *
     * @returns {Promise<Object[]>} Array of Policy objects. This array will be empty
     * if either there are no Policies for the given `datasetId`.
     */
    listAll(_requestContext: any, datasetId: string, fields?: any[]): Promise<any[]>;
    /**
     * Lists all Policy records for a given `datasetId` and Policy `type`.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {string} datasetId ID of an existing Dataset.
     * @param {string} type Type of policy to retrieve.
     * @param {string[]=[]} fields Array of fields to include on an allow list basis.
     * If empty or not provided, all fields are included in the response by default.
     *
     * @returns {Promise<Object[]>} Array of Policy objects. This array will be empty
     * if either there are no Policies for the given `datasetId`.
     */
    listAllByType(_requestContext: any, datasetId: string, type: string, fields?: any[]): Promise<any[]>;
    /**
     * Gets a Policy record, with the given `datasetId` and `policyId`.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {string} datasetId ID of an existing Dataset.
     * @param {string} policyId ID of an existing Policy.
     * @param {string[]=[]} fields Array of fields to include on an allowlist basis.
     * If empty or not provided, all fields are included in the response by default.
     *
     * @throws {BoomError} With code "forbidden" if the principal defined in
     * `requestContext` is not authorized to perform this action.
     * @returns {Promise<(Object|undefined)>} If it exists, then returns the Policy object.
     */
    find(_requestContext: any, datasetId: string, policyId: string, fields?: any[]): Promise<(any | undefined)>;
    /**
     * Gets a Policy record, with the given `datasetId` and `policyId`.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {string} datasetId ID of an existing Dataset.
     * @param {string} policyId ID of an existing Policy.
     * @param {string[]=[]} fields Array of fields to include on an allowlist basis.
     * If empty or not provided, all fields are included in the response by default.
     *
     * @throws {BoomError} With code "forbidden" if the principal defined in
     * `requestContext` is not authorized to perform this action.
     * @throws {BoomError} With code "notFound" if the policy does not exist.
     * @returns {Promise<Object>} If it exists, then returns a Policy object.
     */
    mustFind(requestContext: any, datasetId: string, policyId: string, fields?: any[]): Promise<any>;
    /**
     * Updates a Policy record, with the given `datasetId` and `policyId`.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {string} datasetId ID of an existing Dataset.
     * @param {string} policyId ID of an existing Policy.
     * @param {Object} rawData Fields to update the Policy with.
     *
     * @throws {BoomError} With code "forbidden" if the principal defined in
     * `requestContext` is not authorized to perform this action.
     * @throws {BoomError} With code "notFound" if the Policy does not exist.
     * @throws {BoomError} With code "badRequest" if `rawData` is in an unexpected format.
     * @throws {BoomError} With code "outdatedUpdateAttempt" if the Policy was updated at approximately
     * the same time by another request, and this request lost the "last write wins" race.
     * @returns {Promise<Object>} Newly updated Policy object.
     */
    update(requestContext: any, datasetId: string, policyId: string, rawData: any): Promise<any>;
    /**
     * Deletes a Policy record, with the given `datasetId` and `policyId`.
     *
     * @param {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param {string} datasetId ID of an existing Dataset.
     * @param {string} policy ID of an existing File.
     *
     * @throws {BoomError} With code "forbidden" if the principal defined in
     * `requestContext` is not authorized to perform this action.
     * @throws {BoomError} With code "notFound" if the File does not exist.
     * @returns {Promise<void>}
     */
    delete(_requestContext: any, datasetId: string, policyId: any): Promise<void>;
}
