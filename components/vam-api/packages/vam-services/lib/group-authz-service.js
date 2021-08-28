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

import { deny, isDeny, allowIfActive, allow } from '@aws-ee/base-services';

function isGuest(requestContext) {
  return _.get(requestContext, 'principal.userRole', '') === 'guest';
}

async function allowIfNotGuest(requestContext, { action }) {
  if (isGuest(requestContext)) {
    return deny(`Cannot perform the specified action "${action}". Only non-guests can.`);
  }
  return allow();
}

// This is a minimal Authz for the group service.
// The group service is consumed by appstream-authz and potentially by metrics-authz to determine group
// membership for the purpose of determining domain groups to be treated as power users/admins.
// Attmepting to consume the group service here for the same purpose will create a cyclic dependency.
class GroupAuthzService extends Service {
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
      case GroupAuthzService.LIST_GROUPS:
        return allowIfNotGuest(requestContext, { action });
      default:
        return deny(`Unknown action: ${action}`);
    }
  }
}

GroupAuthzService.LIST_GROUPS = 'list-groups';

export default GroupAuthzService;
