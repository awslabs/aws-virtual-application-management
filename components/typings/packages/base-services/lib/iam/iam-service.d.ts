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

export default IamService;
declare class IamService {
    init(): Promise<void>;
    /** @type {AWS.IAM} */
    api: AWS.IAM;
    /**
     * @param {string} roleName an IAM role name
     * @param iamClient Optional AWS SDK IAM client instance initialized with appropriate credentials.
     * If no client is given then the method will use the SDK with credentials initialized by the
     * "aws" service.
     *
     * @returns {Promise<string[]>} a list of all inline policy names
     */
    listAllInlineRolePolicies(roleName: string, iamClient: any): Promise<string[]>;
    /**
     * @param {string} roleName an IAM role name
     * @param iamClient Optional AWS SDK IAM client instance initialized with appropriate credentials.
     * If no client is given then the method will use the SDK with credentials initialized by the
     * "aws" service.
     * @param roleName
     * @param iamClient
     *
     * @returns {Promise<{PolicyArn: string, PolicyName: string}[]>} a list of all managed (attached) policies
     */
    listAllManagedRolePolicies(roleName: string, iamClient: any): Promise<{
        PolicyArn: string;
        PolicyName: string;
    }[]>;
    listAllPolicyVersions(policyArn: any, iamClient: any): Promise<any>;
    deletePolicy(policyArn: any, iamClient: any): Promise<any>;
    deleteNonDefaultPolicyVersions(policyArn: any, iamClient: any): Promise<void>;
    deletePolicyVersion(policyArn: any, versionId: any, iamClient: any): Promise<any>;
    createPolicyVersion(policyArn: any, policyDocument: any, setAsDefault: any, iamClient: any): Promise<any>;
    deleteOldestPolicyVersionIfNeeded(policyArn: any, iamClient: any): Promise<void>;
    getRoleInfo(roleName: any, iamClient: any): Promise<{
        Role: any;
    }>;
    getRolePolicy(roleName: any, policyName: any, iamClient: any): Promise<{
        PolicyDocument: string;
        PolicyDocumentObj: any;
    }>;
    getPolicyVersion(policyArn: any, versionId: any, iamClient: any): Promise<{
        PolicyVersion: any;
    }>;
    /**
     * Clones the role specified by the roleName from the source account to target account with the same role
     * name and permissions
     *
     * LIMITATION: This method does not clone permissions boundary
     *
     * @param roleName Name of the role to be cloned
     * @param iamClientForSrcAcc The IAM SDK client instance initialized with credentials for the source account where the role exists
     * @param iamClientForTargetAcc The IAM SDK client instance initialized with credentials for the target account where the role needs to be created
     * @returns {Promise<*>}
     */
    cloneRole(roleName: any, iamClientForSrcAcc: any, iamClientForTargetAcc: any): Promise<any>;
    syncInlinePolicies(srcRole: any, targetRole: any, iamClientForSrcAcc: any, iamClientForTargetAcc: any): Promise<void>;
    syncManagedPolicies(srcRole: any, targetRole: any, iamClientForSrcAcc: any, iamClientForTargetAcc: any): Promise<void>;
}
