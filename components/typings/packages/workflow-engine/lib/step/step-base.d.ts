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

import KeyGetterDelegate from '../helpers/key-getter-delegate';

export default StepBase;
declare class StepBase {
    constructor({ input, workflowInstance, workflowPayload, stepState, step, stepReporter, workflowStatus }: {
        input: any;
        workflowInstance: any;
        workflowPayload: any;
        stepState: any;
        step: any;
        stepReporter: any;
        workflowStatus: any;
    });
    input: any;
    workflowInstance: any;
    workflowPayload: any;
    workflowStatus: any;
    state: any;
    step: any;
    reporter: any;
    config: StepConfig;
    payload: {
        getValue(key: any): Promise<any>;
        setKey(key: any, value: any): Promise<any>;
        removeKey(key: any, { limited }?: {
            limited?: boolean;
        }): Promise<any>;
        removeAllKeys({ limited }?: {
            limited?: boolean;
        }): Promise<any>;
    };
    payloadOrConfig: KeyGetterDelegate;
    meta: any;
    wait(seconds: number): WaitDecisionBuilder;
    pause(seconds: number): PauseDecisionBuilder;
    thenGoToStep(stepIndex: any): GoToDecision;
    thenCall(methodName: any, ...params: any[]): CallDecision;
    print(message: any, ...params: any[]): any;
    statusMessage(message: any): Promise<any>;
    clearStatusMessage(): Promise<any>;
    clearPreviousStepsErrors(): Promise<void>;
    printError(error: any, ...params: any[]): any;
    /**
     * Returns a plain JavaScript object containing all key/value passed in the "meta"
     * @returns {Promise<[unknown]>}
     */
    toMetaContent(): Promise<[unknown]>;
    /**
     * Returns a plain JavaScript object containing all key/value accumulated in the workflow payload so far
     * @returns {Promise<[unknown]>}
     */
    toPayloadContent(): Promise<[unknown]>;
    buildPayload(workflowPayload: any, step: any): {
        getValue(key: any): Promise<any>;
        setKey(key: any, value: any): Promise<any>;
        removeKey(key: any, { limited }?: {
            limited?: boolean;
        }): Promise<any>;
        removeAllKeys({ limited }?: {
            limited?: boolean;
        }): Promise<any>;
    };
}
import StepConfig from "./step-config";
import WaitDecisionBuilder from "./decisions/wait-decision-builder";
import PauseDecisionBuilder from "./decisions/pause-decision-builder";
import GoToDecision from "./decisions/goto-decision";
import CallDecision from "./decisions/call-decision";
