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
    constructor({ workflowReporter, step, workflowInstanceService }: {
        workflowReporter: any;
        step: any;
        workflowInstanceService: any;
    });
    instanceId: any;
    stepIndex: any;
    instanceService: any;
    stepStarted(): Promise<any>;
    stepSkipped(): Promise<any>;
    stepPaused(reasonForPause: any): Promise<any>;
    stepResumed(reasonForResume: any): Promise<any>;
    stepMaxPauseReached(): Promise<any>;
    stepPassed(): Promise<any>;
    stepFailed(error: any): Promise<any>;
    statusMessage(message: any): Promise<any>;
    clearStatusMessage(): Promise<any>;
}
