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

import { appContextItemsPlugin, initializationPlugin, menuItemsPlugin, routesPlugin } from '@aws-ee/main-ui';

// baseAppContextItemsPlugin registers app context items (such as base MobX stores etc) provided by the base component
// baseInitializationPlugin registers the base initialization logic provided by the base ui component
// baseMenuItemsPlugin registers menu items provided by the base component
// baseRoutesPlugin registers base routes provided by the base component
const extensionPoints = {
  'app-context-items': [baseAppContextItemsPlugin, appContextItemsPlugin],
  'initialization': [baseInitializationPlugin, initializationPlugin],
  'authentication': [baseAuthenticationPlugin],
  'app-component': [baseAppComponentPlugin],
  'menu-items': [baseMenuItemsPlugin, menuItemsPlugin],
  'routes': [baseRoutesPlugin, routesPlugin],
};

function getPlugins(extensionPoint) {
  return extensionPoints[extensionPoint];
}

const registry = {
  getPlugins,
};

export default registry;
