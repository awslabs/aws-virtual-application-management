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
import {
  isDeny,
  allowIfActive,
  allowIfAdmin,
  allowIfCurrentUserOrAdmin,
  allow,
} from '../authorization/authorization-utils';

class UserAuthzService extends Service {
  async authorize(requestContext, { resource, action, effect, reason }, ...args) {
    // if effect is "deny" already (due to any of the previous plugins returning "deny") then return "deny" right away
    if (isDeny({ effect })) return { resource, action, effect, reason };

    switch (action) {
      case 'create':
        return this.authorizeCreate(requestContext, { action }, ...args);
      case 'createBulk':
        return this.authorizeCreateBulk(requestContext, { action }, ...args);
      case 'delete':
        return this.authorizeDelete(requestContext, { action }, ...args);
      case 'update':
        return this.authorizeUpdate(requestContext, { action }, ...args);
      case 'updateAttributes':
        return this.authorizeUpdateAttributes(requestContext, { action }, ...args);
      default:
        // This authorizer does not know how to perform authorizer for the specified action so return with the current
        // authorization decision collected so far
        return { effect };
    }
  }

  // Protected methods
  async authorizeCreate(requestContext, { action }) {
    // Make sure the caller is active
    let permissionSoFar = await allowIfActive(requestContext, { action });
    if (isDeny(permissionSoFar)) return permissionSoFar; // return if denying

    // Only admins can create users by default
    permissionSoFar = await allowIfAdmin(requestContext, { action });
    if (isDeny(permissionSoFar)) return permissionSoFar; // return if denying

    // If code reached here then allow this call
    return allow();
  }

  async authorizeCreateBulk(requestContext, { action }) {
    // Make sure the caller is active
    let permissionSoFar = await allowIfActive(requestContext, { action });
    if (isDeny(permissionSoFar)) return permissionSoFar; // return if denying

    // Only admins can create users in bulk by default
    permissionSoFar = await allowIfAdmin(requestContext, { action });
    if (isDeny(permissionSoFar)) return permissionSoFar; // return if denying

    // If code reached here then allow this call
    return allow();
  }

  async authorizeDelete(requestContext, { action }) {
    // basic authorization rules for delete user are same as create user at the moment
    const result = await this.authorizeCreate(requestContext, { action });

    // return right away if denying
    if (isDeny(result)) return result; // return if denying

    // If code reached here then allow this call
    return allow();
  }

  async authorizeUpdate(requestContext, { action }, user) {
    // Allow update to "pending" status even if the caller is inactive to support self-enrollment application
    let permissionSoFar;
    if (user.status !== 'pending') {
      // When updating user's status to anything other than "pending" make sure the caller is active
      // Make sure the caller is active
      permissionSoFar = await allowIfActive(requestContext, { action });
      if (isDeny(permissionSoFar)) return permissionSoFar; // return if denying
    }

    // User can update only their own attributes unless the user is an admin
    const { uid } = user;
    permissionSoFar = await allowIfCurrentUserOrAdmin(requestContext, { action }, { uid });
    if (isDeny(permissionSoFar)) return permissionSoFar; // return if denying

    return allow();
  }

  async authorizeUpdateAttributes(requestContext, { action }, user, existingUser) {
    const isBeingUpdated = attribName => {
      const oldValue = _.get(existingUser, attribName);
      const newValue = _.get(user, attribName);
      // The update ignores undefined values during update (i.e., it retains existing values for those)
      // so compare for only if the new value is undefined
      return !_.isUndefined(newValue) && oldValue !== newValue;
    };

    // Make sure an inactive user isn't updating attributes
    permissionSoFar = await allowIfActive(requestContext, { action });
    if (isDeny(permissionSoFar)) return permissionSoFar; // return if denying

    let permissionSoFar;
    // Make sure that we allow updating "isExternalUser", "userRole" and "isAdmin" is done only by admins
    if (
      isBeingUpdated('isExternalUser') ||
      isBeingUpdated('userRole') ||
      isBeingUpdated('isAdmin') ||
      isBeingUpdated('status') ||
      isBeingUpdated('identityProviderName') ||
      isBeingUpdated('authenticationProviderId') ||
      isBeingUpdated('isSamlAuthenticatedUser')
    ) {
      permissionSoFar = await allowIfAdmin(requestContext, { action });
      if (isDeny(permissionSoFar)) return permissionSoFar; // return if denying
    }

    // If code reached here then allow this call
    return allow();
  }
}
export default UserAuthzService;
