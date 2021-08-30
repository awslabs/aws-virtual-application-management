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

export default WorkflowEventTriggersService;
declare class WorkflowEventTriggersService {
    init(): Promise<void>;
    workflowSolutionEventsHandlerArn: any;
    _getter: () => any;
    _scanner: () => any;
    _updater: () => any;
    _query: () => any;
    _deleter: () => any;
    find(_requestContext: any, { id, fields }: {
        id: any;
        fields?: any[];
    }): Promise<any>;
    mustFind(requestContext: any, { id, fields }: {
        id: any;
        fields?: any[];
    }): Promise<any>;
    list(_requestContext: any, { nextToken, maxResults, fields }: {
        nextToken: any;
        maxResults?: number;
        fields?: any[];
    }): Promise<any>;
    listByWorkflow(_requestContext: any, { workflowId, fields }: {
        workflowId: any;
        fields?: any[];
    }): Promise<any>;
    create(requestContext: any, rawData: any): Promise<any>;
    delete(requestContext: any, { id }: {
        id: any;
    }): Promise<any>;
    _fromDbToDataObject(rawDb: any, overridingProps?: {}): any;
}
