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

export default AwsService;
declare class AwsService {
    init(): Promise<void>;
    get sdk(): typeof import("aws-sdk");
    /**
     * Method assumes the specified role and constructs an instance of the
     * specified AWS client SDK with the temporary credentials obtained by
     * assuming the role.
     *
     * @param roleArn The ARN of the role to assume
     * @param roleSessionName Optional name of the role session (defaults to <envName>-<current epoch time>)
     * @param externalId Optional external id to use for assuming the role.
     * @param clientName Name of the client SDK to create (E.g., S3, SageMaker, ServiceCatalog etc)
     * @param options Optional options object to pass to the client SDK (E.g., { apiVersion: '2011-06-15' })
     * @returns {Promise<*>}
     */
    getClientSdkForRole({ roleArn, roleSessionName, externalId, clientName, options }?: {
        roleArn: any;
        roleSessionName: any;
        externalId: any;
        clientName: any;
        options?: {};
    }): Promise<any>;
    /**
     * Method assumes the specified role and returns the temporary credentials obtained by
     * assuming the role.
     *
     * @param roleArn The ARN of the role to assume
     * @param roleSessionName Optional name of the role session (defaults to <envName>-<current epoch time>)
     * @param externalId Optional external id to use for assuming the role.
     * @returns {Promise<{accessKeyId, secretAccessKey, sessionToken}>}
     */
    getCredentialsForRole({ roleArn, roleSessionName, externalId }: {
        roleArn: any;
        roleSessionName: any;
        externalId: any;
    }): Promise<{
        accessKeyId: any;
        secretAccessKey: any;
        sessionToken: any;
    }>;
    prepareForLocal(aws: any): Promise<void>;
    prepareWithLocalRoleCreds(aws: any): Promise<void>;
    assumeLocalRole(aws: any, localRoleArn: any): Promise<any>;
}
