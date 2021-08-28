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

export default WorkflowTemplateDraftService;
declare class WorkflowTemplateDraftService {
    init(): Promise<void>;
    tableName: any;
    createDraft(requestContext: any, { isNewTemplate, templateId: templateIdRaw, templateTitle, templateVer }?: {
        isNewTemplate?: boolean;
        templateId: any;
        templateTitle: any;
        templateVer?: number;
    }): Promise<any>;
    updateDraft(requestContext: any, draft?: {}): Promise<any>;
    publishDraft(requestContext: any, draft?: {}): Promise<{
        template: any;
        hasErrors: boolean;
    }>;
    deleteDraft(requestContext: any, { id }: {
        id: any;
    }): Promise<void>;
    list(requestContext: any, { fields }?: {
        fields?: any[];
    }): Promise<any>;
    findDraft({ id, fields }: {
        id: any;
        fields?: any[];
    }): Promise<any>;
    mustFindDraft({ id, fields }: {
        id: any;
        fields: any;
    }): Promise<any>;
}
