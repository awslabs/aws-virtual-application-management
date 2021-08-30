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

export default StepPayload;
declare class StepPayload {
    constructor({ step, workflowInstance }: {
        step: any;
        workflowInstance: any;
    });
    workflowInstance: any;
    step: any;
    content: {};
    dirty: boolean;
    loaded: boolean;
    setMemento(content?: {}): StepPayload;
    getMemento(): {};
    load(): Promise<void>;
    save(): Promise<void>;
    spread(): Promise<{}>;
    allKeys(): Promise<any>;
    hasKey(key: any): Promise<any>;
    getValue(key: any): Promise<any>;
    setKey(key: any, value: any): Promise<void>;
    removeKey(key: any): Promise<void>;
    removeAllKeys(): Promise<void>;
}
