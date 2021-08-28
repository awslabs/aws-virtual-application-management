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

const nonGuest = [
  'listApplications',
  'listImages',
  'listImageBuilders',
  'listFleets',
  'listDynamicCatalogs',
  'listGroups',
  'getFleet',
];

const poweruserOrAdmin = ['createImage', 'shareImage', 'revokeImageSharing', 'createFleet', 'swapImage', 'deleteImage'];

const poweruserOrGroupMember = [
  'startFleet',
  'stopFleet',
  'deleteFleet',
  'getFleetLink',
  'createDynamicCatalog',
  'deleteDynamicCatalog',
];

const poweruserOrGroupMembersForGroups = ['grantAccessToGroup', 'revokeAccessToGroup'];

/**
 * Returns an array of user roles.
 *
 * @param rolesSoFar An array of defined user roles up to this point.
 * @param pluginRegistry A registry that provides plugins registered by various components for the specified extension point.
 *
 * @returns {Promise<Array<Object>>}
 */
const getRoles = async (rolesSoFar, _pluginRegistry) => {
  /**
   * Here is an example on how to define a new user role:
   *
   * const customRole = {
   *  id: 'customRole',
   *  description: 'Custom Role',
   *  userType: 'INTERNAL',
   *  capabilities: ['canDoSomething1'],
   * };
   *
   * The role can have capabilities from start or the list of capabilities can be empty.
   */

  const poweruserRole = {
    id: 'poweruserRole',
    description: 'Power User',
    userType: 'INTERNAL',
    capabilities: [...nonGuest, ...poweruserOrAdmin, ...poweruserOrGroupMember, ...poweruserOrGroupMembersForGroups],
  };

  return [...rolesSoFar, poweruserRole];
};

/**
 * Returns an array of user capabilities.
 *
 * @param capabilitiesSoFar An array of defined user capabilities up to this point.
 * @param pluginRegistry A registry that provides plugins registered by various components for the specified extension point.
 *
 * @returns {Promise<Array<Object>>}
 */
const getCapabilities = async (capabilitiesSoFar, _pluginRegistry) => {
  /**
   * Here is an example on how to define a new user capability:
   *
   * const customCapability = {
   *  id: 'canDoSomething3',
   *  description: 'Allows the user to do something 3',
   * };
   */

  const mkCap = id => {
    return {
      id,
      description: `Allows ${id}`,
    };
  };

  return [
    ...capabilitiesSoFar,
    ...nonGuest.map(mkCap),
    ...poweruserOrAdmin.map(mkCap),
    ...poweruserOrGroupMember.map(mkCap),
    ...poweruserOrGroupMembersForGroups.map(mkCap),
  ];
};

/**
 * Returns a map of user capabilities attached to a user role ID.
 *
 * @param roleCapabilityUpdatesSoFar A map of user capability arrays indexed by user role id and aggregated up to this point.
 * @param pluginRegistry A registry that provides plugins registered by various components for the specified extension point.
 *
 * @returns {Promise<Array<Object>>}
 */
const setRoleCapabilities = async (roleCapabilityUpdatesSoFar, _pluginRegistry) => {
  /**
   * Here is an example on how to set two capabilities on the user role with ID 'guest'
   * const customCapabilities = ['canDoSomething1', 'canDoSomething2'];
   *
   * if (_.isEmpty(roleCapabilityUpdatesSoFar.guest)) {
   *  roleCapabilityUpdatesSoFar.guest = [];
   * }
   * roleCapabilityUpdatesSoFar.guest = _.concat(roleCapabilityUpdatesSoFar.guest, customCapabilities);
   */

  return roleCapabilityUpdatesSoFar;
};

const usersPlugin = { getRoles, getCapabilities, setRoleCapabilities };

export default usersPlugin;
