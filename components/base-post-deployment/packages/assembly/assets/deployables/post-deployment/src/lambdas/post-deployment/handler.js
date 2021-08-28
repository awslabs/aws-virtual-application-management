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

import { ServicesContainer } from '@aws-ee/base-services-container';
import { registerServices } from '@aws-ee/base-services';
import { registerSteps } from '@aws-ee/base-post-deployment';
import pluginRegistry from '@aws-ee/main-registry-post-deployment';

async function handler(event, _context) {
  // eslint-disable-line no-unused-vars
  // register services
  const container = new ServicesContainer(['settings', 'log']);
  // registerServices - Registers services by calling each service registration plugin in order.
  await registerServices(container, pluginRegistry);

  // registerSteps - Registers post deployment steps by calling each step registration plugin in order.
  const stepsMap = await registerSteps(container, pluginRegistry);
  await container.initServices();

  const log = await container.find('log');

  if (_.toLower(event.action) === 'remove') {
    await preRemove({ log, stepsMap, container });
  } else {
    await postDeploy({ log, stepsMap, container });
  }
}

async function postDeploy({ log, stepsMap, container }) {
  try {
    log.info('Post deployment -- STARTED');
    const entries = Array.from(stepsMap);
    // We need to await execution of steps in the strict sequence so awaiting in loop
    for (let i = 0; i < entries.length; i += 1) {
      const entry = entries[i];
      const name = entry[0]; // entry is [stepServiceName, serviceImpl]
      // Get stepService impl from container instead of entry[1] to make sure the container gets a chance to initialize all service dependencies (if any)
      const stepService = await container.find(name); // eslint-disable-line no-await-in-loop
      log.info(`====> Running ${name}.execute()`);
      await stepService.execute(); // eslint-disable-line no-await-in-loop
    }
    log.info('Post deployment -- ENDED');
  } catch (error) {
    log.error(error);
    throw error;
  }
}

async function preRemove({ log, stepsMap, container }) {
  try {
    log.info('Pre remove -- STARTED');
    const entries = Array.from(stepsMap);

    // perform the cleanup in reverse order of the post-deployment steps registration
    const cleanupSteps = _.reverse(entries);
    // We need to await execution of steps in the strict sequence so awaiting in loop
    for (let i = 0; i < cleanupSteps.length; i += 1) {
      const entry = cleanupSteps[i];
      const name = entry[0]; // entry is [stepServiceName, serviceImpl]
      // Get stepService impl from container instead of entry[1] to make sure the container gets a chance to initialize all service dependencies (if any)
      const stepService = await container.find(name); // eslint-disable-line no-await-in-loop

      // not all post-deployment steps provide cleanup method, call only if it's available
      if (_.isFunction(stepService.cleanup)) {
        log.info(`====> Running ${name}.cleanup()`);
        await stepService.cleanup(); // eslint-disable-line no-await-in-loop
      } else {
        log.warn(
          `Post-deployment step "${name}" does not provide any cleanup method. Each post-deployment step should provide a cleanup method to undo all post-deployment work during un-deployment.`,
        );
      }
    }
    log.info('Pre remove -- ENDED');
  } catch (error) {
    log.error(error);
    throw error;
  }
}

export { handler };
