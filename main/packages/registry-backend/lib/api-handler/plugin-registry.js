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
import { routesPlugin as controllersPlugin } from '@aws-ee/main-controllers';
import { servicesPlugin } from '@aws-ee/main-services';

import { servicesPlugin as eventBridgeServicesPlugin } from '@aws-ee/eventbridge-services';

import { routesPlugin as vamRoutesPlugin } from '@aws-ee/vam-api';
import { servicesPlugin as vamServicesPlugin } from '@aws-ee/vam-services';
import { servicesPlugin as metricsServicesPlugin } from '@aws-ee/vam-metrics';

import {
  authenticationProviderPlugin as cognitoAuthNProviderPlugin,
  servicesPlugin as baseAuthCognitoServicesPlugin,
  userManagementPlugin as cognitoUserManagementPlugin,
} from '@aws-ee/base-auth-cognito-backend/dist/api-handler';

import {
  baseWfRoutesPlugin as workflowRoutesPlugin,
  baseWfServicesPlugin as workflowServicesPlugin,
} from '@aws-ee/base-workflow-api';
import routesPlugin from './plugins/routes-plugin';

const extensionPoints = {
  'service': [
    baseServicesPlugin,
    baseAuthCognitoServicesPlugin,
    servicesPlugin,
    eventBridgeServicesPlugin,
    vamServicesPlugin,
    workflowServicesPlugin,
    metricsServicesPlugin,
  ],
  'authentication-provider': [cognitoAuthNProviderPlugin],
  'user-management': [cognitoUserManagementPlugin],
  'route': [baseRoutesPlugin, controllersPlugin, routesPlugin, vamRoutesPlugin, workflowRoutesPlugin],
  'audit': [],
  'json-schema-validation': [],
  'eventbridge': [],
  'i18n': [],
  'file-schemas': [],
};

async function getPlugins(extensionPoint) {
  return extensionPoints[extensionPoint];
}

const registry = {
  getPlugins,
};

export default registry;
