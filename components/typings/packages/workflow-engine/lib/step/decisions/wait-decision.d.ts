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

export default WaitDecision;
declare class WaitDecision {
    static is(decisionMemento?: {}): boolean;
    type: string;
    seconds: any;
    check: Invoker;
    thenCall: Invoker;
    otherwise: Invoker;
    max: any;
    counter: any;
    setMemento({ s, mx, co, ch, tc, ot, wt }?: {
        s: any;
        mx: any;
        co: any;
        ch: any;
        tc: any;
        ot: any;
        wt: any;
    }): WaitDecision;
    title: any;
    getMemento(): {
        type: string;
    };
    checkNotBooleanMessage(): string;
    maxReachedMessage(): string;
    decrement(): WaitDecision;
    reachedMax(): boolean;
    getMethodName(invoker?: {}): any;
}
import Invoker from "../invoker";
