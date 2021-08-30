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

import _ from 'lodash';
import { getClientSdk } from './aws-helper';

async function doesCfnStackExist({ awsProfile, awsRegion, stackName }) {
  const cfn = getClientSdk({
    clientName: 'CloudFormation',
    awsProfile,
    awsRegion,
  });

  let exists = false;
  try {
    await cfn.describeStacks({ StackName: stackName }).promise();
    exists = true;
  } catch (err) {
    // It throws ValidationError when passing stackName that does not exist
    // Rethrow in case of any other error
    if (err.code !== 'ValidationError') {
      throw err;
    }
  }
  return exists;
}

/**
 * Returns AWS CloudFormation Stack Outputs for the given stack
 *
 * @param awsProfile Optional, AWS Credentials profile. By default, it will look for credentials using default credentials provider chain i.e., in env variables, then a profile named "default", then EC2 instance profile. See https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CredentialProviderChain.html#defaultProviders-property for more info.
 * @param awsRegion AWS region code to create the AWS SDK client with
 * @param stackName Name of the AWS CloudFormation Stack to get the outputs from
 * @returns {Promise<{description?: string, exportName?: string, value?: string|boolean|number, key: string}[]>}
 */
async function getCfnOutputs({ awsProfile, awsRegion, stackName }) {
  const cfn = getClientSdk({
    clientName: 'CloudFormation',
    awsProfile,
    awsRegion,
  });
  const data = await cfn.describeStacks({ StackName: stackName }).promise();
  const stack = _.get(data, 'Stacks[0]');
  const outputs = _.get(stack, 'Outputs', []);

  return _.map(outputs, item => ({
    key: item.OutputKey,
    value: item.OutputValue,
    description: item.Description,
    exportName: item.ExportName,
  }));
}

/**
 * Returns a AWS CloudFormation Stack Output identified by the given "outputKey" for the given stack
 *
 * @param awsProfile Optional, AWS Credentials profile. By default, it will look for credentials using default credentials provider chain i.e., in env variables, then a profile named "default", then EC2 instance profile. See https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CredentialProviderChain.html#defaultProviders-property for more info.
 * @param awsRegion AWS region code to create the AWS SDK client with
 * @param stackName Name of the AWS CloudFormation Stack to get the outputs from
 * @param outputKey The "OutputKey" of the output to return
 * @returns {Promise<{description?: string, exportName?: string, value?: string|boolean|number, key: string}>}
 */
async function getCfnOutput({ awsProfile, awsRegion, stackName, outputKey }) {
  const outputs = await getCfnOutputs({ awsProfile, awsRegion, stackName });
  return _.find(outputs, { key: outputKey });
}

export { doesCfnStackExist, getCfnOutputs, getCfnOutput };
