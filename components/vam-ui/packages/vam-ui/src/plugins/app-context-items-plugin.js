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

import * as appstreamImagesStore from '../models/appstream-images/AppstreamImagesStore';
import * as appstreamImageBuildersStore from '../models/appstream-image-builders/AppstreamImageBuildersStore';
import * as appstreamApplicationsStore from '../models/appstream-applications/AppstreamApplicationsStore';
import * as appstreamFleetsStore from '../models/appstream-fleets/AppstreamFleetsStore';
import * as dynamicCatalogsStore from '../models/dynamic-catalogs/DynamicCatalogsStore';
import * as groupsStore from '../models/groups/GroupsStore';
import * as metricsStore from '../models/metrics/MetricsStore';

function registerAppContextItems(appContext) {
  appstreamImagesStore.registerContextItems(appContext);
  appstreamImageBuildersStore.registerContextItems(appContext);
  appstreamApplicationsStore.registerContextItems(appContext);
  appstreamFleetsStore.registerContextItems(appContext);
  dynamicCatalogsStore.registerContextItems(appContext);
  groupsStore.registerContextItems(appContext);
  metricsStore.registerContextItems(appContext);
}

// eslint-disable-next-line no-unused-vars
function postRegisterAppContextItems(appContext) {
  // No impl at this level
}

const plugin = {
  registerAppContextItems,
  postRegisterAppContextItems,
};

export default plugin;
