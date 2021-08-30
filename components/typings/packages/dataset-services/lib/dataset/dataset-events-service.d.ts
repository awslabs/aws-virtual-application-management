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

export default DatasetEventsService;
declare class DatasetEventsService {
    init(): Promise<void>;
    datasetEventSourceSystem: any;
    /**
     * Transforms a raw CloudTrail event into an appropriate dataset bus event and publishes it on EventBridge.
     *
     * @param {Object} requestContext Request context object, as defined in `@aws-ee/base-services-container/lib/request-context`.
     * @param {Object} rawEvent The raw JSON event from CloudTrail.
     *
     * @throws {BoomError} With code "badRequest" if `rawEvent` is in an unexpected format (from underlying parse methods).
     * @returns {Promise<Object>} Newly formatted Dataset event, in a representation suitable for the global event bus.
     */
    handleCloudTrailEvent(requestContext: any, rawEvent: any): Promise<any>;
    /**
     * Parses a raw CloudTrail event into an appropriate dataset bus event.
     *
     * @param {Object} requestContext Request context object, as defined in `@aws-ee/base-services-container/lib/request-context`.
     * @param {Object} rawEvent The raw JSON event from CloudTrail.
     *
     * @throws {BoomError} With code "badRequest" if `rawEvent` is in an unexpected format.
     * @returns {Promise<Object>} Newly formatted Dataset event, in a representation suitable for the global event bus.
     */
    parseCloudTrailEvent(requestContext: any, rawEvent: any): Promise<any>;
    /**
     * Transforms a raw solution EventBridge bus event into an appropriate service call.
     *
     * @param {Object} requestContext Request context object, as defined in `@aws-ee/base-services-container/lib/request-context`.
     * @param {Object} rawEvent The raw JSON event from EventBridge.
     *
     * @throws {BoomError} With code "badRequest" if the bus event detail type is not recognized.
     * @returns {Promise<Object>} Result of the invoked service call (e.g. fileService.create()).
     */
    handleSolutionBusEvent(requestContext: any, rawEvent: any): Promise<any>;
}
