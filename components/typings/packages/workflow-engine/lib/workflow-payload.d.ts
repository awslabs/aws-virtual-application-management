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

export default WorkflowPayload;
declare class WorkflowPayload {
    constructor({ input, meta, workflowInstance }: {
        input: any;
        meta: any;
        workflowInstance: any;
    });
    input: any;
    workflowInstance: any;
    store: any[];
    meta: any;
    loaded: boolean;
    setMemento({ s, m }?: {
        s?: any[];
        m?: {};
    }): WorkflowPayload;
    getMemento(): {
        s: any;
        m: any;
    };
    get dirty(): boolean;
    load(): Promise<void>;
    save(): Promise<void>;
    getValue(key: any): Promise<any>;
    getStepPayload({ stpIndex }?: {
        stpIndex: any;
    }): Promise<any>;
    removeKey(key: any): Promise<void>;
    removeAllKeys(): Promise<void>;
    /**
     * Returns an array of all keys that are available from the workflow payload so far
     * @returns {Promise<Array>}
     */
    allKeys(): Promise<Array>;
    /**
     * Returns a plain JavaScript object containing all key/value accumulated in the workflow payload so far
     * @returns {Promise<[unknown]>}
     */
    toPayloadContent(): Promise<[unknown]>;
    searchableStores(): any;
}
