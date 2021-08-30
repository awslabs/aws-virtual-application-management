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
/* eslint-disable no-loop-func */
/* eslint-disable no-await-in-loop */
const _ = require('lodash');
const {
  utils: { run },
} = require('@aws-ee/api-testing-framework');

// allow delay loops to last for up to 30 minutes
// (2,000 * 900 == 1,800,000ms == 1,800s == 30 minutes)
const defaultDelay = 2000; // milliseconds
const maxDelayIter = 900; // delay up to 900 times
class Appstream {
  constructor({ aws, sdk }) {
    this.aws = aws;
    this.sdk = sdk;
  }

  async describeStacks() {
    const results = [];
    const params = {};

    do {
      const response = await this.sdk.describeStacks(params).promise();
      const stacks = response.Stacks;
      if (stacks) {
        results.push(...stacks);
      }
      params.NextToken = response.NextToken;
    } while (params.NextToken);

    return results;
  }

  async deleteStack(stackName) {
    const stacks = await this.describeStacks();
    if (_.find(stacks, (stack) => stack.Name === stackName)) {
      return run(async () => this.sdk.deleteStack({ Name: stackName }).promise());
    }

    return `stack '${stackName}' not found.`;
  }

  async disassociateFleet(fleetName) {
    const knownFleets = await this.describeFleets();
    const fleetToDisassociate = _.find(knownFleets, (f) => {
      return f.Name === fleetName;
    });

    if (!fleetToDisassociate) {
      return `fleet/stack ${fleetName} not found`;
    }

    await run(async () => this.sdk.disassociateFleet({ FleetName: fleetName, StackName: fleetName }).promise());
    return {};
  }

  async deleteFleet(name) {
    // check if the fleet exists.
    const knownFleets = await this.describeFleets();
    const fleetToDelete = _.find(knownFleets, (f) => {
      return f.Name === name;
    });

    if (!fleetToDelete) {
      return `fleet ${name} not found`;
    }

    await run(async () => this.sdk.deleteFleet({ Name: name }).promise());
    return {};
  }

  async describeFleets() {
    const result = [];
    const params = {};

    do {
      const response = await run(async () => this.sdk.describeFleets(params).promise());
      if (response.Fleets) {
        result.push(...response.Fleets);
      }

      params.NextToken = response.NextToken;
    } while (params.NextToken);

    return result;
  }

  async stopFleet(fleetName) {
    console.log(`Ensuring '${fleetName} is stopped.`);
    let fleetState = 'PROCESSING';

    do {
      const fleets = await this.describeFleets();
      const fleet = _.find(fleets, (f) => f.name === fleetName);
      if (!fleet) {
        return;
      }

      fleetState = _.get(fleet, 'state');
      if (fleetState === 'RUNNING') {
        await run(async () => this.sdk.stopFleet({ name: fleetName }).promise());
      }

      console.log(`JEST: ${process.env.JEST_WORKER_ID}: '${fleetName}' in '${fleetState}', Waiting for 15 seconds.`);
      await new Promise((resolve) => setTimeout(resolve, 15000));
    } while (fleetState && fleetState !== 'STOPPED');
  }

  async deleteImage(name) {
    // check if the image to delete exists yet.
    let knownImages = await this.describeImages();
    let imageToDelete = _.find(knownImages, (i) => {
      return i.Name === name;
    });

    // if the image is not found, check if there is an imagebuilder working on it
    if (!imageToDelete) {
      let imageBuilders = await this.descirbeImageBuilders();
      let targetBuilder = _.find(imageBuilders, (ib) => {
        return _.includes(ib.ImageArn, name);
      });
      if (targetBuilder) {
        const imageArn = targetBuilder.ImageArn;
        let iter = 0;
        while (targetBuilder && ['PENDING', 'SNAPSHOTTING'].includes(targetBuilder.State) && iter < maxDelayIter) {
          _.delay(async () => {
            iter += 1;
            imageBuilders = await this.descirbeImageBuilders();
            targetBuilder = _.find(imageBuilders, (ib) => {
              return ib.ImageArn === imageArn;
            });
          }, defaultDelay);
        }
      }

      // if all goes well, the image should exist at this point.
      knownImages = await this.describeImages();
      imageToDelete = _.find(knownImages, (i) => {
        return i.Name === name;
      });
    }

    if (imageToDelete) {
      await run(async () => this.sdk.deleteImage({ Name: name }).promise());
    } else {
      return `image "${name}" not found`;
    }

    return {};
  }

  async describeImages() {
    const result = [];
    const params = {
      Type: 'PRIVATE',
      MaxResults: 25,
    };

    do {
      const response = await run(async () => this.sdk.describeImages(params).promise());
      const images = response.images;

      if (images) {
        result.push(...images);
      }

      params.NextToken = response.NextToken;
    } while (params.NextToken);

    return result;
  }

  async descirbeImageBuilders() {
    const result = [];
    const params = {
      MaxResults: 5,
    };

    do {
      const response = await run(async () => this.sdk.describeImageBuilders(params).promise());

      if (response.ImageBuilders) {
        result.push(...response.ImageBuilders);
      }

      params.NextToken = response.NextToken;
    } while (params.NextToken);

    return result;
  }
}

// The aws javascript sdk client name
Appstream.clientName = 'AppStream';

// The framework is expecting this method. This is how the framework registers your aws services.
async function registerServices({ registry }) {
  registry.set('appstream', Appstream);
}

module.exports = { registerServices };
