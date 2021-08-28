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

import { cloudFormation } from './aws';
import { fnFail } from './util';
import { logDebug } from './log';

class CustomResource {
  constructor(event, workspace) {
    this.event = event;
    this.workspace = workspace;
  }

  async fetchStackTags(stackArn) {
    logDebug(`fetchStackTags for stack '${stackArn}'`);
    const response = await cloudFormation.describeStacks({ StackName: stackArn }).promise();
    logDebug(`fetchStackTags: describeStacks: ${JSON.stringify(response)}`);
    const stackTags = {};
    const thisStack = (response.Stacks || []).find(element => element.StackId === stackArn) || {};
    (thisStack.Tags || []).forEach(pair => {
      const { Key, Value } = pair;
      stackTags[Key] = Value;
    });
    logDebug(`fetchStackTags: ${JSON.stringify(stackTags)}`);
    return stackTags;
  }

  async handler() {
    const {
      RequestType: requestType,
      ResourceProperties: properties,
      OldResourceProperties: oldProperties,
      StackId: stackArn,
      RequestId,
    } = this.event;
    const requestId = RequestId.replace(/-/g, '').substr(0, 32); // this must be maximum 32 chars
    Object.assign(this.workspace, { requestId, stackArn, properties, oldProperties });

    const dispatch = {
      Create: this.create.bind(this),
      Update: this.update.bind(this),
      Delete: this.remove.bind(this),
    };

    const fnOperation =
      dispatch[requestType] ||
      (async () => {
        fnFail(`Invalid request type: '${requestType}'`);
      });

    return fnOperation();
  }

  async create() {
    fnFail('Create not implemented');
  }

  async update() {
    fnFail('Update not implemented');
  }

  async remove() {
    fnFail('Remove not implemented');
  }
}

export { CustomResource };
