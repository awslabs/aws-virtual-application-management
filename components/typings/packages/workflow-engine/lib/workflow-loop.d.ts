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

export default WorkflowLoop;
declare class WorkflowLoop {
    constructor({ workflowInstance, stepLoopProvider }: {
        workflowInstance: any;
        stepLoopProvider: any;
    });
    workflowInstance: any;
    stepLoopProvider: any;
    workflowStatus: WorkflowStatus;
    stepsCount: any;
    eventDelegate: EventDelegate;
    setMemento({ st, ws }?: {
        st?: string;
        ws?: {};
    }): WorkflowLoop;
    stateLabel: any;
    getMemento(): {
        st: any;
        ws: {
            er: any[];
            ec: number;
        };
    };
    tick(): Promise<any>;
    stepLoop: any;
    on(name: any, fn: any): WorkflowLoop;
    processStepLoopDecision(decision: any, stepLoop: any): Promise<any>;
    catchAndReport(fn: any): Promise<any>;
    eitherLoopOrPass(): Promise<any>;
    goToStep(stepIndex: any): Promise<{
        type: string;
    }>;
    eitherFailOrLoopOrPass(error?: {}): Promise<any>;
    fireEvent(name: any, ...params: any[]): Promise<void>;
    passDecision(): Promise<any>;
    waitDecision(waitInSeconds?: number): Promise<{
        type: string;
        wait: number;
    }>;
    pauseDecision(waitInSeconds?: number): Promise<{
        type: string;
        wait: number;
    }>;
    loopDecision(): Promise<{
        type: string;
    }>;
    failDecision(error: any): Promise<any>;
}
import WorkflowStatus from "./workflow-status";
import EventDelegate from "./helpers/event-delegate";
