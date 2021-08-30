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

import Dashboard from '../parts/dashboard/Dashboard';
import AuthenticationProvidersList from '../parts/authentication-providers/AuthenticationProvidersList';
import AddSingleCognitoUser from '../parts/users/AddSingleCognitoUser';
import AddUser from '../parts/users/AddUser';
import User from '../parts/users/User';
import withAuth from '../withAuth';

/**
 * Adds base routes to the given routesMap.
 * @param routesMap A Map containing routes. This object is a Map that has route paths as
 * keys and React Component as value.
 * @param appContext An application context object containing various Mobx Stores, Models etc.
 *
 * @returns {Promise<*>} Returns a Map with the mapping of base routes vs React Component
 */
// eslint-disable-next-line no-unused-vars
function registerRoutes(routesMap, { location, appContext }) {
  const routes = new Map([...routesMap, ['/authentication-providers', withAuth(AuthenticationProvidersList)]]);

  routes.set('/users/add/cognito', withAuth(AddSingleCognitoUser));
  routes.set('/users/add', withAuth(AddUser));
  routes.set('/users', withAuth(User));
  routes.set('/dashboard', withAuth(Dashboard));

  return routes;
}

/**
 * Returns default route. By default this method returns the
 * '/dashboard' route as the default route
 * @returns {{search: *, state: *, hash: *, pathname: string}}
 */
function getDefaultRouteLocation({ location, _appContext }) {
  // See https://reacttraining.com/react-router/web/api/withRouter
  const defaultLocation = {
    pathname: '/dashboard',
    search: location.search, // we want to keep any query parameters
    hash: location.hash,
    state: location.state,
  };

  return defaultLocation;
}

const plugin = {
  registerRoutes,
  getDefaultRouteLocation,
};

export default plugin;
