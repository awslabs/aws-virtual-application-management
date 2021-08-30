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

export default StepReporter;
declare class StepReporter {
    constructor({ workflowReporter, step }: {
        workflowReporter: any;
        step: any;
    });
    workflowReporter: any;
    step: any;
    log: any;
    logPrefixObj: any;
    stepStarted(): Promise<void>;
    stepSkipped(): Promise<void>;
    stepPassed(): Promise<void>;
    stepPaused(reasonForPause: any): Promise<void>;
    stepResumed(reasonForResume: any): Promise<void>;
    stepFailed(error: any): Promise<void>;
    statusMessage(message: any): Promise<void>;
    clearStatusMessage(): Promise<void>;
    printStepInformation(msg?: string, ...params: any[]): void;
    print(msg: any, ...params: any[]): void;
    printError(raw?: {}, ...params: any[]): void;
    logIt(obj: any): void;
    logItError(obj: any): void;
}
