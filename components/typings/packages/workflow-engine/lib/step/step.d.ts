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

export default Step;
declare class Step {
    constructor({ index, workflowSelectedStep }?: {
        index: any;
        workflowSelectedStep: any;
    });
    index: any;
    selectedStep: any;
    get stepTemplateId(): any;
    get stepTemplateVer(): any;
    get title(): any;
    get skippable(): any;
    get src(): any;
    get remote(): boolean;
    get lambdaArn(): any;
    get overrides(): any;
    get configs(): any;
    get stpTmplId(): any;
    get stpTmplVer(): any;
    get stpIndex(): any;
    get stpTitle(): any;
    get logPrefixStr(): string;
    get logPrefixObj(): {
        stpIndex: any;
        stpTmplId: any;
        stpTmplVer: any;
    };
    get info(): any;
}
