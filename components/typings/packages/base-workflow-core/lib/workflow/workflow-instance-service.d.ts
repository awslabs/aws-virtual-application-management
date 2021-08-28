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

export default WorkflowInstanceService;
declare class WorkflowInstanceService {
    init(): Promise<void>;
    tableName: any;
    createInstance(requestContext: any, meta: any, input: any): Promise<any>;
    changeWorkflowStatus(input: any): Promise<any>;
    /**
     * A method to save additional step attributes in form of key/value pairs to the specified step in the
     * specified workflow execution instance.
     *
     * @param input
     * @returns {Promise<void>}
     */
    saveStepAttribs(requestContext: any, input: any): Promise<void>;
    changeStepStatus(input: any): Promise<any>;
    listByStatus({ startTime, endTime, status, fields }?: {
        startTime: any;
        endTime: any;
        status: any;
        fields?: any[];
    }): Promise<any>;
    list({ workflowId, workflowVer, fields }?: {
        workflowId: any;
        workflowVer: any;
        fields?: any[];
    }): Promise<any>;
    listPaged({ maxResults, nextToken, fields }?: {
        maxResults?: number;
        nextToken: any;
        fields?: any[];
    }): Promise<any>;
    findInstance({ id, fields }: {
        id: any;
        fields?: any[];
    }): Promise<any>;
    mustFindInstance({ id, fields }: {
        id: any;
        fields: any;
    }): Promise<any>;
}
