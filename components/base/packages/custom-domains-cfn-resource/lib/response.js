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

/* eslint-disable no-console */
import https from 'https';
import url from 'url';

const SUCCESS = 'SUCCESS';
const FAILED = 'FAILED';

function send(event, context, { responseStatus, responseData, physicalResourceId, reason }) {
  const responseBody = JSON.stringify({
    Status: responseStatus,
    Reason: reason || `See the details in CloudWatch Log Stream: ${context.logStreamName}`,
    PhysicalResourceId: physicalResourceId,
    StackId: event.StackId,
    RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Data: responseData,
  });

  console.log('Response body:\n', responseBody);
  const parsedUrl = url.parse(event.ResponseURL);
  const options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.path,
    method: 'PUT',
    headers: {
      'content-type': '',
      'content-length': responseBody.length,
    },
  };

  const request = https.request(options, response => {
    console.log(`Status code: ${response.statusCode}`);
    console.log(`Status message: ${response.statusMessage}`);
    context.done();
  });

  request.on('error', error => {
    console.log(`send(..) failed executing https.request(..): ${error}`);
    context.done();
  });

  request.write(responseBody);
  request.end();
}

const response = {
  send,
  SUCCESS,
  FAILED,
};

export { response };
