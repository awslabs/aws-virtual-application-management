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

export default StepLoop;
declare class StepLoop {
    constructor({ step, stepClassProvider, workflowStatus }: {
        step: any;
        stepClassProvider: any;
        workflowStatus: any;
    });
    step: any;
    stepClassProvider: any;
    workflowStatus: any;
    stateLabel: string;
    decisionQueue: any[];
    eventDelegate: EventDelegate;
    setMemento({ st, dq }?: {
        st?: string;
        dq?: any[];
    }): StepLoop;
    getMemento(): {
        st: any;
    };
    on(name: any, fn: any): StepLoop;
    get logPrefixStr(): any;
    get logPrefixObj(): any;
    tick(): Promise<any>;
    stepImplementation: any;
    processDecisionQueue(): Promise<{
        type: string;
    }>;
    processStepDecision(possibleDecision: any): Promise<{
        type: string;
    }>;
    shouldSkip(): any;
    getStepImplementation(): Promise<any>;
    catchAndReport(fn: any): Promise<any>;
    callOnPass(): Promise<void>;
    callOnFail(error: any): Promise<any>;
    fireEvent(name: any, ...params: any[]): Promise<void>;
    safeFireEvent(name: any, ...params: any[]): Promise<any>;
    passDecision(): {
        type: string;
    };
    waitDecision(waitInSeconds?: number): {
        type: string;
        wait: number;
    };
    pauseDecision(waitInSeconds?: number): {
        type: string;
        wait: number;
    };
    goToDecision(stepIndex: any): {
        type: string;
        stepIndex: any;
    };
    loopDecision(): {
        type: string;
    };
    failDecision(error: any): any;
}
import EventDelegate from "../helpers/event-delegate";
