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

export function doesCfnStackExist({ awsProfile, awsRegion, stackName }: {
    awsProfile: any;
    awsRegion: any;
    stackName: any;
}): Promise<boolean>;
/**
 * Returns AWS CloudFormation Stack Outputs for the given stack
 *
 * @param awsProfile Optional, AWS Credentials profile. By default, it will look for credentials using default credentials provider chain i.e., in env variables, then a profile named "default", then EC2 instance profile. See https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CredentialProviderChain.html#defaultProviders-property for more info.
 * @param awsRegion AWS region code to create the AWS SDK client with
 * @param stackName Name of the AWS CloudFormation Stack to get the outputs from
 * @returns {Promise<{description?: string, exportName?: string, value?: string|boolean|number, key: string}[]>}
 */
export function getCfnOutputs({ awsProfile, awsRegion, stackName }: {
    awsProfile: any;
    awsRegion: any;
    stackName: any;
}): Promise<{
    description?: string;
    exportName?: string;
    value?: string | boolean | number;
    key: string;
}[]>;
/**
 * Returns a AWS CloudFormation Stack Output identified by the given "outputKey" for the given stack
 *
 * @param awsProfile Optional, AWS Credentials profile. By default, it will look for credentials using default credentials provider chain i.e., in env variables, then a profile named "default", then EC2 instance profile. See https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CredentialProviderChain.html#defaultProviders-property for more info.
 * @param awsRegion AWS region code to create the AWS SDK client with
 * @param stackName Name of the AWS CloudFormation Stack to get the outputs from
 * @param outputKey The "OutputKey" of the output to return
 * @returns {Promise<{description?: string, exportName?: string, value?: string|boolean|number, key: string}>}
 */
export function getCfnOutput({ awsProfile, awsRegion, stackName, outputKey }: {
    awsProfile: any;
    awsRegion: any;
    stackName: any;
    outputKey: any;
}): Promise<{
    description?: string;
    exportName?: string;
    value?: string | boolean | number;
    key: string;
}>;
