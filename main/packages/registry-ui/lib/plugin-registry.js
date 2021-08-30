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

import {
  baseAppContextItemsPlugin,
  baseInitializationPlugin,
  baseAuthenticationPlugin,
  baseAppComponentPlugin,
  baseMenuItemsPlugin,
  baseRoutesPlugin,
} from '@aws-ee/base-ui';

import {
  menuItemsPlugin as vamMenuItemsPlugin,
  routesPlugin as vamRoutesPlugin,
  appContextItemsPlugin as vamAppContextItemsPlugin,
  initializationPlugin as vamInitializationPlugin,
} from '@aws-ee/vam-ui';

import {
  // workflowI18nPlugin,
  workflowMenuItemsPlugin,
  workflowRoutesPlugin,
  workflowAppContextItemsPlugin,
} from '@aws-ee/base-workflow-ui';

import appContextItemsPlugin from './plugins/app-context-items-plugin';
import initializationPlugin from './plugins/initialization-plugin';
import menuItemsPlugin from './plugins/menu-items-plugin';
import routesPlugin from './plugins/routes-plugin';

// baseAppContextItemsPlugin registers app context items (such as base MobX stores etc) provided by the base component
// baseInitializationPlugin registers the base initialization logic provided by the base ui component
// baseMenuItemsPlugin registers menu items provided by the base component
// baseRoutesPlugin registers base routes provided by the base component
const extensionPoints = {
  'app-context-items': [
    baseAppContextItemsPlugin,
    vamAppContextItemsPlugin,
    appContextItemsPlugin,
    workflowAppContextItemsPlugin,
  ],
  'initialization': [baseInitializationPlugin, vamInitializationPlugin, initializationPlugin],
  'authentication': [baseAuthenticationPlugin],
  'app-component': [baseAppComponentPlugin],
  'menu-items': [baseMenuItemsPlugin, vamMenuItemsPlugin, menuItemsPlugin, workflowMenuItemsPlugin],
  'routes': [baseRoutesPlugin, vamRoutesPlugin, routesPlugin, workflowRoutesPlugin],
  'i18n': [],
};

function getPlugins(extensionPoint) {
  return extensionPoints[extensionPoint];
}

const registry = {
  getPlugins,
};

export default registry;
