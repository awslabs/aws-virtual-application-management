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

export default LogTransformer;
declare class LogTransformer {
    constructor(loggingContext?: {}, fieldsToMask?: string[]);
    loggingContext: {};
    fieldsToMask: string[];
    transformForInfo(logPayload: any): string;
    transformForLog(logPayload: any): string;
    transformForDebug(logPayload: any): string;
    transformForWarn(logPayload: any): string;
    transformForError(logPayload: any): string;
    transform(logPayload: any, logLevel: any): string;
    /**
     * Augments the given data with standard logging metadata specified in the loggingContext
     * (such as 'envType', 'envName', 'appName', 'functionName') etc.
     *
     * @param data The raw data to be logged.
     * @param additionalContext Object containing additional logging contextual information as key, value pairs. This is in addition to the loggingContext.
     * The payload of this additionalContext and the loggingContext (specified at the time constructing the LoggingTransformer object) will be added to the raw logging data.
     *
     * @return {string} A transformed logging data along with additional information from the loggingContext and the additionalContext as string.
     */
    augment(data: any, additionalContext?: {}): string;
    /**
     * The function returns a new deep copy of the given object with the properties that are specified in the
     * keysToMask as masked
     * @param object The object to deep copy from
     * @param keysToMask The properties to be masked in the returned object
     * @return {*} A deep copy of the object with the specified properties masked as ****
     */
    maskDeep(object: any, keysToMask: any): any;
}
