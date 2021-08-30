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
import i18n from 'roddeh-i18n';
import { handlerFactory } from '@aws-ee/base-api-handler-factory';
import { registerServices as registerServicesUtil } from '@aws-ee/base-services';
import { registerRoutes as registerRoutesUtil } from '@aws-ee/base-api-handler';
import { apiHandlerPluginRegistry as pluginRegistry } from '@aws-ee/main-registry-backend';

/**
 * Registers services by calling each service registration plugin in order.
 *
 * @param container An instance of ServicesContainer
 * @returns {Promise<void>}
 */
async function registerServices(container) {
  return registerServicesUtil(container, pluginRegistry);
}

/**
 * Configures the given express router by collecting routes contributed by all route plugins.
 * @param context An instance of AppContext from api-handler-factory
 * @param router Top level Express router
 *
 * @returns {Promise<unknown[]>}
 */
async function registerRoutes(context, router) {
  return registerRoutesUtil(context, router, pluginRegistry);
}

async function registerI18n() {
  // Create the roddeh-i18n translator instances based on the set of translations that have been collected from the components and placed in the generated files.
  // Note, the ../../i18n/index.js file looks empty now because it will be generated as part of the assembly process.
  let translations = {};
  try {
    // eslint-disable-next-line import/no-dynamic-require,global-require
    translations = require('../../i18n/translations.json');
    // eslint-disable-next-line no-empty
  } catch (_e) {
    // Swallow the require error
    return {};
  }

  const translators = {};
  _.forIn(translations, (value, language) => {
    translators[language] = i18n.create(value);
  });
  return translators;
}

// The main lambda handler function. This is the entry point of the lambda function
// Calls handlerFactory that creates a Lambda function
// 1. by creating an Express JS application instance and registering all API routes by calling the "registerRoutes" function we pass here
// 2. by initializing a services container instance and registering all service instances to the container by calling the "registerServices" function we pass here
// The handler function returned by the "handlerFactory" has the classical Lambda handler function signature of (event, context) => Promise
const handler = handlerFactory({ registerServices, registerRoutes, registerI18n });

export { handler };
