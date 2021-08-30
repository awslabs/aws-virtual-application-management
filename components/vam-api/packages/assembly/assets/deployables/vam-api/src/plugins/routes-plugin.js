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

import appstreamLinksController from '../appstream-links-controller';

/**
 * Adds base routes to the given routesMap.
 * @param routesMap A Map containing routes. This object is a Map that has route paths as
 * keys and an array of functions that configure the router as value. Each function in the
 * array is expected have the following signature. The function accepts context and router
 * arguments and returns a configured router.
 *
 * (context, router) => configured router
 *
 * @param pluginRegistry A registry that provides plugins registered by various components for the specified extension point.
 * @param context An instance of AppContext from api-handler-factory. Provides access to settings and services.
 *
 * @returns {Promise<*>} Returns a Map with the mapping of base routes vs their router configurer functions
 */
// eslint-disable-next-line no-unused-vars
async function getLtiRoutes(routesMap, pluginRegistry, context) {
  const routes = new Map([
    ...routesMap,
    // PUBLIC APIS - No base middlewares to configure
    ['/api/appstream-links', [appstreamLinksController]],
  ]);

  return routes;
}

const plugin = {
  getRoutes: getLtiRoutes,
};

export default plugin;
