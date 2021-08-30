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

export default CallDecision;
declare class CallDecision {
    static is(decisionMemento?: {}): boolean;
    constructor(invoker: any);
    type: string;
    thenCall: any;
    setMemento({ tc }?: {
        tc: any;
    }): CallDecision;
    getMemento(): {
        type: string;
    };
    get methodName(): any;
}
