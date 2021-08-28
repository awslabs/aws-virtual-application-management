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

import { ServicesContainer } from '@aws-ee/base-services-container';
import { registerServices } from '@aws-ee/base-services';
import { authnHandlerPluginRegistry as pluginRegistry } from '@aws-ee/main-registry-backend';

import newHandler from './handler-impl';

const initHandler = (async () => {
  const container = new ServicesContainer(['settings', 'log']);
  // registerServices - Registers services by calling each service registration plugin in order.
  await registerServices(container, pluginRegistry);
  await container.initServices();
  const authenticationService = await container.find('authenticationService');
  const log = await container.find('log');
  return newHandler({ authenticationService, log });
})();

const handler = async (...args) => {
  return (await initHandler)(...args);
};

export { handler };
