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

/* eslint-disable no-await-in-loop */
const _ = require('lodash');
const {
  utils: { run },
} = require('@aws-ee/api-testing-framework');

class StepFunctions {
  constructor({ aws, sdk }) {
    this.aws = aws;
    this.sdk = sdk;
  }

  async listStateMachines() {
    const result = [];

    const params = {
      maxResults: 100,
    };

    do {
      const response = await this.sdk.listStateMachines(params).promise();
      if (response.stateMachines) {
        result.push(...response.stateMachines);
      }

      params.nextToken = response.nextToken;
    } while (params.nextToken);
    return result;
  }

  async findStateMachine(stateMachineName) {
    return _.find(await this.listStateMachines(), (sm) => {
      return sm.name === stateMachineName;
    });
  }

  async listRunningExecutions(stateMachineArn) {
    const result = [];
    const params = {
      stateMachineArn,
      statusFilter: 'RUNNING',
      maxResults: 1000,
    };

    do {
      const response = await this.sdk.listExecutions(params).promise();

      if (response.executions) {
        result.push(...response.executions);
      }

      params.nextToken = response.nextToken;
    } while (params.nextToken);

    return result;
  }

  async stopExecutionsForWorkflow(stateMachineName, workFlowName) {
    // Get the statemachine ARN.
    // Get the execution ARN and verify it is in progress.
    // Stop the exeuction if it is in progress.
    const stateMachine = await this.findStateMachine(stateMachineName);
    let stateMachineArn;

    if (stateMachine) {
      stateMachineArn = stateMachine.stateMachineArn;
    }

    const executions = _.filter(await this.listRunningExecutions(stateMachineArn), (e) => {
      return e.name.startsWith(workFlowName);
    });

    _.forEach(executions, async (e) => {
      await run(async () =>
        this.sdk
          .stopExecution({ executionArn: e.executionArn, error: 'execution aborted', cause: 'API Testing Cleanup' })
          .promise(),
      );
    });
  }
}

StepFunctions.clientName = 'StepFunctions';

async function registerServices({ registry }) {
  registry.set('stepFunctions', StepFunctions);
}

module.exports = { registerServices };
