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

export default WorkflowInstance;
declare class WorkflowInstance {
    constructor({ workflowInstance }?: {
        workflowInstance?: {};
    });
    wfInst: {};
    wf: any;
    steps: any;
    get id(): any;
    get stepAttribs(): any;
    get workflowId(): any;
    get workflowVer(): any;
    get title(): any;
    get wfInstId(): any;
    get wfId(): any;
    get wfVer(): any;
    get wfTitle(): any;
    get logPrefixString(): string;
    get logPrefixObj(): {
        wfInstId: any;
        wfId: any;
        wfVer: any;
    };
    get info(): any;
}
