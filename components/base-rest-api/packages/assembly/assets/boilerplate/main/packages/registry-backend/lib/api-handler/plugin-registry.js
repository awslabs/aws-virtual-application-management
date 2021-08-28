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

import { servicesPlugin as baseServicesPlugin } from '@aws-ee/base-api-handler';
import { routesPlugin as baseRoutesPlugin } from '@aws-ee/base-controllers';
import { auditPlugin as baseAuditPlugin } from '@aws-ee/base-services';
import { routesPlugin as controllersPlugin } from '@aws-ee/main-controllers';
import { servicesPlugin } from '@aws-ee/main-services';

import routesPlugin from './plugins/routes-plugin';

const extensionPoints = {
  service: [baseServicesPlugin, servicesPlugin],
  route: [baseRoutesPlugin, controllersPlugin, routesPlugin],
  audit: [baseAuditPlugin],
};

async function getPlugins(extensionPoint) {
  return extensionPoints[extensionPoint];
}

const registry = {
  getPlugins,
};

export default registry;
