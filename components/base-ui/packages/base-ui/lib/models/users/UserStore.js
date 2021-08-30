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
import { toJS } from 'mobx';
import { types, getEnv } from 'mobx-state-tree';

import { getUser } from '../../helpers/api';
import { BaseStore, isStoreReady } from '../BaseStore';
import { User } from './User';

const UserStore = BaseStore.named('UserStore')
  .props({
    user: types.maybe(User),
  })
  .actions(self => {
    // save the base implementation of cleanup
    const superCleanup = self.cleanup;

    return {
      async doLoad() {
        // Get the user from the backend
        const user = await getUser();

        const userRolesStore = getEnv(self).userRolesStore;
        if (!isStoreReady(userRolesStore)) {
          await userRolesStore.load();
        }

        // Append the latest capabilities for the current users role
        const userRole = _.get(user, 'userRole');
        const updatedRoleData = userRolesStore.userRoles.get(userRole);
        const updatedCapabilities = toJS(_.get(updatedRoleData, 'capabilities'));
        if (!_.isEmpty(updatedCapabilities)) {
          user.userCapabilities = updatedCapabilities;
        }

        self.runInAction(() => {
          self.user = User.create(user);
        });
      },
      cleanup: () => {
        self.user = undefined;
        superCleanup();
      },
    };
  })

  .views(self => ({
    get empty() {
      return _.isEmpty(self.user);
    },
  }));

function registerContextItems(appContext) {
  appContext.userStore = UserStore.create({}, appContext);
}

export { UserStore, registerContextItems };
