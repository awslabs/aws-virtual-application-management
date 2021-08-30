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

export default WorkflowTemplateService;
declare class WorkflowTemplateService {
    init(): Promise<void>;
    tableName: any;
    createVersion(requestContext: any, manifest?: {}, { isLatest, tableName }?: {
        isLatest?: boolean;
        tableName: any;
    }): Promise<any>;
    updateVersion(requestContext: any, manifest?: {}, { isLatest, tableName }?: {
        isLatest?: boolean;
        tableName: any;
    }): Promise<any>;
    listVersions({ id, fields }?: {
        id: any;
        fields?: any[];
    }): Promise<any>;
    list({ fields }?: {
        fields?: any[];
    }): Promise<any>;
    findVersion({ id, v, fields }: {
        id: any;
        v?: number;
        fields?: any[];
    }, { tableName }?: {
        tableName: any;
    }): Promise<any>;
    mustFindVersion({ id, v, fields }: {
        id: any;
        v?: number;
        fields: any;
    }): Promise<any>;
    applyDefaults(manifest: any): any;
    populateSteps(manifest: any): Promise<any>;
}
