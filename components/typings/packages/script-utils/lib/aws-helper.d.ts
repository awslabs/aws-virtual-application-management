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

/**
 * Returns an AWS SDK client appropriately configured based on the given parameters.
 *
 * @param clientName Name of AWS SDK client (e.g., "S3", "IAM", "SSM" etc)
 * @param awsProfile Optional, AWS Credentials profile. By default, it will look for credentials using default credentials provider chain i.e., in env variables, then a profile named "default", then EC2 instance profile. See https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CredentialProviderChain.html#defaultProviders-property for more info.
 * @param awsRegion AWS region code to create the AWS SDK client with
 * @param options Any additional options to pass to the AWS SDK client
 * @returns {*} AWS SDK Client object for the specified service
 */
export function getClientSdk({ clientName, awsProfile, awsRegion, options }: {
    clientName: any;
    awsProfile: any;
    awsRegion: any;
    options?: {};
}): any;
