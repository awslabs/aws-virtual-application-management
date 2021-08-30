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

export default WorkflowStatus;
declare class WorkflowStatus {
    constructor({ workflowInstance }: {
        workflowInstance: any;
    });
    workflowInstance: any;
    errorCount: number;
    errors: any[];
    logPrefixObj: any;
    setMemento({ er, ec }?: {
        er?: any[];
        ec?: number;
    }): WorkflowStatus;
    getMemento(): {
        er: any[];
        ec: number;
    };
    hasErrors(): boolean;
    clearErrors(): void;
    addError(error: any, stepLoop: any): void;
    get lastError(): any;
}
