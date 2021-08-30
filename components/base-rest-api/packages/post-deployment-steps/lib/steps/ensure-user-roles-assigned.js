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
import { getSystemRequestContext, UserRolesMap } from '@aws-ee/base-services';

/**
 * This helper post-deployment step is used to audit the DbUsers table to make sure that users have a `userRoles` field.
 * If it finds a user that does not have this field, it will set the userRole to `admin` if `isAdmin` is true for the user, `guest` otherwise.
 *
 * Since `userRole` is now used as part of the authentication,
 * this step exists in order to support existing users created through different means to be able to continue authenticating.
 */
class EnsureUserRolesAssigned extends Service {
  constructor() {
    super();
    this.dependency(['userService', 'aws']);
  }

  async createUserRoles() {
    const [userService] = await this.service(['userService']);

    const requestContext = getSystemRequestContext();
    let nextToken;
    do {
      // eslint-disable-next-line no-await-in-loop
      const result = await userService.listUsers(requestContext, { nextToken });
      const promises = result.items.map(async user => {
        if (!_.isEmpty(user.userRole)) {
          return;
        }

        let userRole = UserRolesMap.GUEST.id;
        if (user.isAdmin) {
          userRole = UserRolesMap.ADMIN.id;
        }

        await userService.updateUser(requestContext, { ..._.pick(user, ['uid', 'rev']), userRole });
      });

      // eslint-disable-next-line no-await-in-loop
      await Promise.all(promises);
      nextToken = result.nextToken;
    } while (!_.isEmpty(nextToken));

    this.log.info(`Finished fixing user roles`);
  }

  async execute() {
    return this.createUserRoles();
  }
}

export default EnsureUserRolesAssigned;
