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

/* eslint-disable import/prefer-default-export */
import { httpApiGet, httpApiPost, httpApiDelete, httpApiPut } from '@aws-ee/base-ui/dist/helpers/api';

function getAppstreamImages() {
  return httpApiGet('api/appstream-images');
}

function getAppstreamImageBuilders() {
  return httpApiGet('api/appstream-image-builders');
}

function createAppstreamImage({
  imageName,
  applications,
  dapEnabled,
  baseImageArn,
  imageBuilderID,
  snapshotImage,
  deleteImageBuilder,
  instanceType,
}) {
  return httpApiPost('api/appstream-images/create', {
    data: {
      imageName,
      applications,
      dapEnabled,
      appstreamImageArn: baseImageArn,
      imageBuilderID,
      snapshotImage,
      deleteImageBuilder,
      instanceType,
    },
  });
}

function shareImage({ imageName, accountId }) {
  return httpApiPost(`api/appstream-images/${imageName}/share`, { data: { imageName, accountId } });
}

function deleteImage({ imageName }) {
  return httpApiDelete(`api/appstream-images/${imageName}`);
}

function revokeImageSharing({ imageName, accountId }) {
  return httpApiDelete(`api/appstream-images/${imageName}/share`, { data: { imageName, accountId } });
}

function getAppstreamApplications() {
  return httpApiGet('api/appstream-applications');
}

function getAppstreamFleets() {
  return httpApiGet('api/appstream-fleets');
}

function createAppstreamFleet({
  fleetName,
  imageName,
  instanceType,
  fleetType,
  streamView,
  maxUserDurationInMinutes,
  disconnectTimeoutInMinutes,
  idleDisconnectTimeoutInMinutes,
  desiredCapacity,
}) {
  return httpApiPost('api/appstream-fleets/create', {
    data: {
      fleetName,
      imageName,
      instanceType,
      fleetType,
      streamView,
      maxUserDurationInMinutes,
      disconnectTimeoutInMinutes,
      idleDisconnectTimeoutInMinutes,
      desiredCapacity,
    },
  });
}

function startFleet({ fleetName }) {
  return httpApiPut('api/appstream-fleets/start', {
    data: {
      fleetName,
    },
  });
}

function stopFleet({ fleetName }) {
  return httpApiPut('api/appstream-fleets/stop', {
    data: {
      fleetName,
    },
  });
}

function deleteFleet({ fleetName }) {
  return httpApiDelete(`api/appstream-fleets/${fleetName}`);
}

function getTestFleetLink({ fleetName }) {
  return httpApiGet(`api/appstream-fleets/${fleetName}/get-link`);
}

function grantGroupForFleet({ fleetName, groupId, groupName }) {
  return httpApiPut(`api/appstream-fleets/${fleetName}/access`, { data: { groupId, groupName } });
}

function revokeGroupForFleet({ fleetName, groupId }) {
  return httpApiDelete(`api/appstream-fleets/${fleetName}/access`, { data: { groupId } });
}

function swapImage({ fleetName, imageName }) {
  return httpApiPut(`api/appstream-fleets/${fleetName}/swap-image`, { data: { imageName } });
}

function getDynamicCatalogs() {
  return httpApiGet('api/dynamic-catalogs');
}

function createDynamicCatalog({ dynamicCatalogName, fleet, applications }) {
  return httpApiPost('api/dynamic-catalogs/create', { data: { dynamicCatalogName, fleet, applications } });
}

function deleteDynamicCatalog({ id }) {
  return httpApiDelete(`api/dynamic-catalogs/${id}`);
}

function getGroups() {
  return httpApiGet('api/groups');
}

function grantGroupForDynamicCatalog({ id, groupId, groupName }) {
  return httpApiPut(`api/dynamic-catalogs/${id}/access`, { data: { groupId, groupName } });
}

function revokeGroupForDynamicCatalog({ id, groupId }) {
  return httpApiDelete(`api/dynamic-catalogs/${id}/access`, { data: { groupId } });
}

function getMetrics() {
  // return {AverageSessionLengthPreviousMonth:{headers:[], values:[]},AverageSessionLengthCurrentMonth:{headers:[], values:[]}, DailySessionsPreviousMonth:{headers:[], values:[]}, DailySessionsCurrentMonth:{headers:[], values:[]}}
  return httpApiGet('api/metrics');
}

export {
  getAppstreamImages,
  getAppstreamImageBuilders,
  shareImage,
  deleteImage,
  revokeImageSharing,
  getAppstreamApplications,
  createAppstreamImage,
  getAppstreamFleets,
  createAppstreamFleet,
  startFleet,
  stopFleet,
  deleteFleet,
  getTestFleetLink,
  grantGroupForFleet,
  revokeGroupForFleet,
  swapImage,
  getDynamicCatalogs,
  createDynamicCatalog,
  deleteDynamicCatalog,
  getGroups,
  grantGroupForDynamicCatalog,
  revokeGroupForDynamicCatalog,
  getMetrics,
};
