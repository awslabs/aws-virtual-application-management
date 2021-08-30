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

export default StepLoopProvider;
declare class StepLoopProvider {
    constructor({ workflowInstance, stepClassProvider, StepLoopClass, RemoteStepLoopClass }?: {
        workflowInstance: any;
        stepClassProvider: any;
        StepLoopClass?: typeof DefaultStepLoop;
        RemoteStepLoopClass: any;
    });
    steps: any;
    stepClassProvider: any;
    currentIndex: number;
    eventDelegate: EventDelegate;
    StepLoop: typeof DefaultStepLoop;
    RemoteStepLoop: any;
    setMemento({ ci, sl }?: {
        ci?: number;
        sl?: {};
    }): StepLoopProvider;
    stepLoopMemento: {};
    getMemento(): {
        ci: number;
    };
    setWorkflowStatus(workflowStatus: any): void;
    workflowStatus: any;
    on(name: any, fn: any): StepLoopProvider;
    next(): Promise<void>;
    goToStep(stepIndex: any): Promise<void>;
    getStepLoop(): Promise<any>;
    stepLoop: any;
    fireEvent(name: any, ...params: any[]): Promise<void>;
}
import EventDelegate from "../helpers/event-delegate";
import DefaultStepLoop from "./step-loop";
