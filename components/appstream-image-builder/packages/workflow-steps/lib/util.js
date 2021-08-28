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
import { retry } from '@aws-ee/base-services';

// no result until finished
const waitForExecution = async ({ instanceID, commandID, aws, log }) => {
  const ssm = new aws.sdk.SSM();
  const params = { CommandId: commandID, InstanceId: instanceID };

  const res = await retry(async () => {
    return ssm.getCommandInvocation(params).promise();
  });

  if (isTerminalCommandStatus(res.Status)) {
    log('TERMINAL', res);
    return res;
  }

  return null;
};

const waitForCommandResult = async ({ commandID, instanceID, logBucket, aws, retries = 5 }) => {
  const s3 = new aws.sdk.S3();
  // We are using a supplied ssm command called RunPowerShellScript.
  // It outputs into a knowable place.
  const key = `ssm/${commandID}/${instanceID}/awsrunPowerShellScript/0.awsrunPowerShellScript/stdout`;
  return retry(async () => {
    const result = await s3.getObject({ Bucket: logBucket, Key: key }).promise();
    return result.Body.toString('utf-8');
  }, retries);
};

const CommandStatus = {
  Pending: 'Pending',
  InProgress: 'InProgress',
  Delayed: 'Delayed',
  Success: 'Success', // terminal state
  Cancelled: 'Cancelled', // terminal state
  TimedOut: 'TimedOut', // terminal state
  Failed: 'Failed', // terminal state
  Cancelling: 'Cancelling',
};

const isTerminalCommandStatus = status => {
  return _.includes(
    [CommandStatus.Success, CommandStatus.Cancelled, CommandStatus.TimedOut, CommandStatus.Failed],
    status,
  );
};

export { waitForExecution, waitForCommandResult, CommandStatus };
