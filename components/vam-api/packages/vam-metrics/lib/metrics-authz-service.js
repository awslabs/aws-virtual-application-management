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

import { deny, isDeny, allowIfActive, allow, isAllow, isAdmin } from '@aws-ee/base-services';

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

async function allowIfNotGuest(requestContext, { action }, ..._args) {
  if (isGuest(requestContext)) {
    return deny(`Cannot perform the specified action "${action}". Only non-guests can.`);
  }
  return allow();
}

class MetricsAuthzService extends Service {
  constructor() {
    super();
    this.dependency(['groupService']);
  }

  // eslint-disable-next-line no-unused-vars
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
      case MetricsAuthzService.LIST_METRICS:
        return allowIfNotGuest(requestContext, { action }, ...args);
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

MetricsAuthzService.LIST_METRICS = 'list-metrics';

export default MetricsAuthzService;
