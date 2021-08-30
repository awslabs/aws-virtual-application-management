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

export default WorkflowReporter;
declare class WorkflowReporter {
    constructor({ workflowInstance, log }: {
        workflowInstance?: {};
        log?: Console;
    });
    wfInstance: {};
    log: Console;
    logPrefixObj: any;
    workflowStarted(): Promise<void>;
    workflowPaused(): Promise<void>;
    workflowResuming(): Promise<void>;
    workflowIsEmpty(): Promise<void>;
    workflowPassed(): Promise<void>;
    workflowFailed(error: any): Promise<void>;
    printWorkflowInformation(msg?: string, ...params: any[]): void;
    print(msg: any, ...params: any[]): void;
    printError(raw?: {}, ...params: any[]): void;
    getStepReporter({ step }: {
        step: any;
    }): StepReporter;
    logIt(obj: any): void;
    logItError(obj: any): void;
}
import StepReporter from "./step/step-reporter";
