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

import { servicesPlugin as baseServicesPlugin, stepsPlugin as baseStepsPlugin } from '@aws-ee/base-post-deployment';

import servicesPlugin from './plugins/services-plugin';
import stepsPlugin from './plugins/steps-plugin';

const extensionPoints = {
  service: [baseServicesPlugin, servicesPlugin],
  postDeploymentStep: [baseStepsPlugin, stepsPlugin],
};

async function getPlugins(extensionPoint) {
  return extensionPoints[extensionPoint];
}

const registry = {
  getPlugins,
};

export default registry;
