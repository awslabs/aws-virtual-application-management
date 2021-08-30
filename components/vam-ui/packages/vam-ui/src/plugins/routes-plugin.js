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
import withAuth from '@aws-ee/base-ui/dist/withAuth';

import AppstreamImages from '../parts/appstream-images/AppstreamImages';
import AppstreamImageDetails from '../parts/appstream-images/AppstreamImageDetails';
import AppstreamApplications from '../parts/appstream-applications/AppstreamApplications';
import CreateAppstreamImage from '../parts/appstream-images/CreateAppstreamImage';
import AppstreamFleets from '../parts/appstream-fleets/AppstreamFleets';
import CreateAppstreamFleet from '../parts/appstream-fleets/CreateAppstreamFleet';
import DynamicCatalogs from '../parts/dynamic-catalogs/DynamicCatalogs';
import SelectAppstreamImage from '../parts/dynamic-catalogs/SelectAppstreamFleet';
import CreateDynamicCatalog from '../parts/dynamic-catalogs/CreateDynamicCatalog';
import AppstreamFleetDetails from '../parts/appstream-fleets/AppstreamFleetDetails';
import DynamicCatalogDetails from '../parts/dynamic-catalogs/DynamicCatalogDetails';
import VamDashboard from '../parts/dashboard/VamDashboard';

/**
 * Adds routes to the given routesMap.
 * @param routesMap A Map containing routes. This object is a Map that has route paths as
 * keys and React Component as value.
 *
 * @returns {Promise<*>} Returns a Map with the mapping of base routes vs React Component
 */
// eslint-disable-next-line no-unused-vars
function registerRoutes(routesMap, { location, appContext }) {
  const routes = new Map([
    ...routesMap,
    ['/appstream-images/details/:modelId', withAuth(AppstreamImageDetails)],
    ['/appstream-images/create/:modelId', withAuth(CreateAppstreamImage)],
    ['/appstream-images/create', withAuth(CreateAppstreamImage)],
    ['/appstream-images', withAuth(AppstreamImages)],
    ['/applications', withAuth(AppstreamApplications)],
    ['/appstream-fleets/details/:modelId', withAuth(AppstreamFleetDetails)],
    ['/appstream-fleets/create', withAuth(CreateAppstreamFleet)],
    ['/appstream-fleets', withAuth(AppstreamFleets)],
    ['/dynamic-catalogs/details/:modelId', withAuth(DynamicCatalogDetails)],
    ['/dynamic-catalogs/create/:appstreamFleetId', withAuth(CreateDynamicCatalog)],
    ['/dynamic-catalogs/create', withAuth(SelectAppstreamImage)],
    ['/dynamic-catalogs', withAuth(DynamicCatalogs)],
    ['/dashboard', withAuth(VamDashboard)],
  ]);

  return routes;
}

function getDefaultRouteLocation({ location, appContext }) {
  const userStore = appContext.userStore;
  // See https://reacttraining.com/react-router/web/api/withRouter
  const isRootUser = _.get(userStore, 'user.isRootUser');
  const defaultLocation = {
    pathname: isRootUser ? '/users' : '/applications',
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
