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
import { isCurrentUser } from './assertions';

function isAdmin(requestContext) {
  return _.get(requestContext, 'principal.isAdmin', false);
}

function isCurrentUserOrAdmin(requestContext, { uid }) {
  return isAdmin(requestContext) || isCurrentUser(requestContext, { uid });
}

function isActive(requestContext) {
  return _.toLower(_.get(requestContext, 'principal.status', '')) === 'active';
}

function allow() {
  return {
    effect: 'allow',
  };
}

function deny(message, safe = false) {
  return {
    effect: 'deny',
    reason: {
      message,
      safe,
    },
  };
}

async function allowIfCreatorOrAdmin(requestContext, { action, resource }, item) {
  const itemCreator = _.get(item, 'createdBy');
  if (_.isEmpty(itemCreator)) {
    return deny(`Cannot ${action} the ${resource}. ${resource} creator information is not available`);
  }

  // Allow if the caller is the item creator (owner) or admin
  const permissionSoFar = await allowIfCurrentUserOrAdmin(requestContext, { action, resource }, { uid: itemCreator });
  if (isDeny(permissionSoFar)) return permissionSoFar; // return if denying

  return allow();
}

async function allowIfCurrentUserOrAdmin(requestContext, { action }, { uid }) {
  if (!isCurrentUserOrAdmin(requestContext, { uid })) {
    return deny(`Cannot perform the specified action "${action}". Only admins or current user can.`);
  }
  return allow();
}

async function allowIfCurrentUser(requestContext, { action }, { uid }) {
  if (!isCurrentUser(requestContext, { uid })) {
    return deny(`Cannot perform the specified action "${action}" on other user's resources.`);
  }
  return allow();
}

async function allowIfActive(requestContext, { action }) {
  // Make sure the current user is active
  if (!isActive(requestContext)) {
    return deny(`Cannot perform the specified action "${action}". The caller is not active.`);
  }
  return allow();
}

async function allowIfAdmin(requestContext, { action }) {
  if (!isAdmin(requestContext)) {
    return deny(`Cannot perform the specified action "${action}". Only admins can.`);
  }
  return allow();
}

function allowIfHasRole(requestContext, { action, resource }, allowedUserRoles) {
  const userRole = _.get(requestContext, 'principal.userRole');
  if (!_.includes(allowedUserRoles, userRole)) {
    const resourceDisplayName = resource || 'resource';
    return deny(
      `Cannot ${action} ${resourceDisplayName}. The user's role "${userRole}" is not allowed to ${action} ${resourceDisplayName}`,
      false,
    );
  }
  return allow();
}

/**
 * Checks if the given principal has all the capabilities required to perform the action.
 * Returns "allow" permission only if the given principal (i.e., the requestContext.principal)
 * has ALL the specified capabilities.
 * This function assumes that the "requestContext.principal.capabilityIds" is populated correctly.
 * The "requestContext.principal.capabilityIds" can be added by the "add-capabilities-to-context" middleware to the route.
 *
 * @param requestContext
 * @param action
 * @param resource
 * @param capabilityIds List of capability IDs. The function will return "allow" permission only if the principal has ALL the specified capabilities.
 * Returns deny if even a single capability from the capabilityIds argument is missing in the principal's capabilityIds.
 */
function allowIfHasAllCapabilities(requestContext, { action, resource }, capabilityIds) {
  const principalCapabilityIds = _.get(requestContext, 'principal.capabilityIds');
  const missing = _.difference(capabilityIds, principalCapabilityIds);
  if (!_.isEmpty(missing)) {
    const resourceDisplayName = resource || 'resource';
    return deny(
      `Cannot ${action} ${resourceDisplayName}. The user does not have ${_.join(
        missing,
        ', ',
      )} capabilities required to perform ${action}`,
      false,
    );
  }
  return allow();
}

/**
 * Checks if the given principal has the any capabilities required to perform the action.
 * Returns "allow" permission only if the given principal (i.e., the requestContext.principal)
 * has any of the specified capabilities.
 * The function returns "allow" as long as the principal has at least one capability listed in the capabilityIds argument.
 * This function assumes that the "requestContext.principal.capabilityIds" is populated correctly.
 * The "requestContext.principal.capabilityIds" can be added by the "add-capabilities-to-context" middleware to the route.
 *
 * @param requestContext
 * @param action
 * @param resource
 * @param capabilityIds List of capability IDs. The function will return "allow" permission only if the principal has any of the specified capabilities.
 * It will return "deny" if the principal does not have any capability specified in the capabilityIds argument.
 */
function allowIfHasAnyCapability(requestContext, { action, resource }, capabilityIds) {
  const principalCapabilityIds = _.get(requestContext, 'principal.capabilityIds');
  if (_.isEmpty(_.intersection(capabilityIds, principalCapabilityIds))) {
    const resourceDisplayName = resource || 'resource';
    return deny(
      `Cannot ${action} ${resourceDisplayName}. The user does not have any required capabilities to perform ${action}`,
      false,
    );
  }
  return allow();
}

function isAllow({ effect }) {
  return _.toLower(effect) === 'allow';
}

function isDeny({ effect }) {
  return _.toLower(effect) === 'deny';
}

export {
  allow,
  deny,
  allowIfCreatorOrAdmin,
  allowIfCurrentUserOrAdmin,
  allowIfCurrentUser,
  allowIfActive,
  allowIfAdmin,
  allowIfHasRole,
  allowIfHasAllCapabilities,
  allowIfHasAnyCapability,
  isAllow,
  isDeny,
  isCurrentUserOrAdmin,
  isAdmin,
  isActive,
};
