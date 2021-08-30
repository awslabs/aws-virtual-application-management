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
import { Service } from '@aws-ee/base-services-container';

import { deny, isDeny, allowIfActive, allowIfAdmin, allow, isAllow, isAdmin } from '@aws-ee/base-services';

function isPoweruser(requestContext) {
  return _.get(requestContext, 'principal.userRole', '') === 'poweruserRole';
}

function isGuest(requestContext) {
  return _.get(requestContext, 'principal.userRole', '') === 'guest';
}

async function allowIfPoweruserOrAdmin(requestContext, { action }) {
  const allowed = isAdmin(requestContext) || isPoweruser(requestContext);
  if (allowed) {
    return allow();
  }
  return deny(`Cannot perform the specified action "${action}". Only admins and powerusers can.`);
}

async function allowIfNotGuest(requestContext, { action }) {
  if (isGuest(requestContext)) {
    return deny(`Cannot perform the specified action "${action}". Only non-guests can.`);
  }
  return allow();
}

class AppstreamAuthzService extends Service {
  constructor() {
    super();
    this.dependency(['groupService']);
  }

  async authorize(requestContext, { resource, action, effect, reason }, ...args) {
    if (!action) {
      const noActionResult = deny(`Invalid action '${action}'`);
      effect = noActionResult.effect;
      reason = noActionResult.reason;
    }
    let permissionSoFar = { effect };
    // if effect is "deny" already (due to any of the previous plugins returning "deny") then return "deny" right away
    if (isDeny(permissionSoFar)) return { resource, action, effect, reason };
    // Make sure the caller is active. This basic check is required irrespective of "action" so checking it here
    permissionSoFar = await allowIfActive(requestContext, { action });
    if (isDeny(permissionSoFar)) return permissionSoFar; // return if denying

    switch (action) {
      case AppstreamAuthzService.LIST_APPLICATIONS:
      case AppstreamAuthzService.LIST_IMAGE_BUILDERS:
      case AppstreamAuthzService.LIST_FLEETS:
      case AppstreamAuthzService.LIST_DYNAMIC_CATALOGS:
      case AppstreamAuthzService.GET_FLEET:
        return allowIfNotGuest(requestContext, { action });
      case AppstreamAuthzService.SHARE_IMAGE:
      case AppstreamAuthzService.REVOKE_IMAGE_SHARING:
      case AppstreamAuthzService.CREATE_FLEET:
      case AppstreamAuthzService.SWAP_IMAGE:
        return allowIfPoweruserOrAdmin(requestContext, { action });
      case AppstreamAuthzService.START_FLEET:
      case AppstreamAuthzService.STOP_FLEET:
      case AppstreamAuthzService.DELETE_FLEET:
      case AppstreamAuthzService.GET_FLEET_LINK:
      case AppstreamAuthzService.CREATE_DYNAMIC_CATALOG:
      case AppstreamAuthzService.DELETE_DYNAMIC_CATALOG:
        return this.allowPowerusersAndGroupMembers(requestContext, { action }, ...args);
      case AppstreamAuthzService.GRANT_ACCESS_TO_GROUP:
      case AppstreamAuthzService.REVOKE_ACCESS_TO_GROUP:
        return this.allowPowerusersAndGroupMembersForGroups(requestContext, { action }, ...args);
      case AppstreamAuthzService.CREATE_IMAGE:
      case AppstreamAuthzService.LIST_IMAGES:
      case AppstreamAuthzService.DELETE_IMAGE:
        return allowIfAdmin(requestContext, { action });
      default:
        return deny(`Unknown action: ${action}`);
    }
  }

  async allowPowerusersAndGroupMembers(requestContext, { action }, fleet) {
    const groupAccess = await this.allowUsersInGroup(requestContext, { action }, fleet);
    if (isAllow(groupAccess)) return groupAccess;
    return allowIfPoweruserOrAdmin(requestContext, { action });
  }

  async allowUsersInGroup(requestContext, { _action }, fleet) {
    const allowedGroups = fleet.sharedGroups.map(g => g.name);
    return this.allowIfInGroup(requestContext, allowedGroups);
  }

  // groupAccessConfigurations: a list of group access configurations, granting or denying to a fleet or dynamic catalog by group.
  async allowPowerusersAndGroupMembersForGroups(requestContext, { action }, groupAccessConfigurations) {
    const groups = groupAccessConfigurations.map(g => g.groupName);
    const groupAccess = await this.allowIfInGroup(requestContext, groups);
    if (isAllow(groupAccess)) return groupAccess;
    return allowIfPoweruserOrAdmin(requestContext, { action });
  }

  async allowIfInGroup(requestContext, targetGroups) {
    const groupService = await this.service('groupService');
    const groups = await groupService.listForUser(requestContext);
    const userGroups = groups.map(g => g.DistinguishedName);
    // if any groups are shared, that is sufficient. all group matches are equal.
    if (_.intersection(targetGroups, userGroups).length > 0) {
      return allow();
    }

    return deny('Not in any groups that would allow access.');
  }
}

AppstreamAuthzService.LIST_APPLICATIONS = 'list-applications';
AppstreamAuthzService.LIST_IMAGES = 'list-images';
AppstreamAuthzService.LIST_IMAGE_BUILDERS = 'list-image-builders';

AppstreamAuthzService.CREATE_IMAGE = 'create-image';
AppstreamAuthzService.SHARE_IMAGE = 'sharing-image';
AppstreamAuthzService.REVOKE_IMAGE_SHARING = 'revoke-image-sharing';
AppstreamAuthzService.DELETE_IMAGE = 'delete-image';

AppstreamAuthzService.LIST_FLEETS = 'list-fleets';
AppstreamAuthzService.GET_FLEET = 'get-fleet';
AppstreamAuthzService.CREATE_FLEET = 'create-fleet';
AppstreamAuthzService.START_FLEET = 'start-fleet';
AppstreamAuthzService.STOP_FLEET = 'stop-fleet';
AppstreamAuthzService.DELETE_FLEET = 'delete-fleet';
AppstreamAuthzService.GET_FLEET_LINK = 'get-fleet-link';
AppstreamAuthzService.SWAP_IMAGE = 'swap-image';

AppstreamAuthzService.LIST_DYNAMIC_CATALOGS = 'list-dynamic-catalogs';
AppstreamAuthzService.CREATE_DYNAMIC_CATALOG = 'create-dynamic-catalog';
AppstreamAuthzService.DELETE_DYNAMIC_CATALOG = 'delete-dynamic-catalog';
AppstreamAuthzService.CREATE_CORRELATION = 'create-correlation';

AppstreamAuthzService.GRANT_ACCESS_TO_GROUP = 'grant-access-to-group';
AppstreamAuthzService.REVOKE_ACCESS_TO_GROUP = 'revoke-access-to-group';

export default AppstreamAuthzService;
