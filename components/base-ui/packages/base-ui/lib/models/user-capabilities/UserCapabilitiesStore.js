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
import { values } from 'mobx';
import { types } from 'mobx-state-tree';
import { BaseStore } from '../BaseStore';

import { consolidateToMap } from '../../helpers/utils';
import { getUserCapabilities } from '../../helpers/api';
import { UserCapability } from './UserCapability';

// ==================================================================
// UserCapabilitiesStore
// ==================================================================
const UserCapabilitiesStore = BaseStore.named('UserCapabilitiesStore')
  .props({
    userCapabilities: types.optional(types.map(UserCapability), {}),
  })

  .actions(self => {
    // save the base implementation of cleanup
    const superCleanup = self.cleanup;

    return {
      async doLoad() {
        const userCapabilitiesResult = await getUserCapabilities();
        const userCapabilities = _.get(userCapabilitiesResult, 'items') || [];
        self.runInAction(() => {
          consolidateToMap(self.userCapabilities, userCapabilities, (exiting, newItem) => {
            exiting.setUserCapability(newItem);
          });
        });
      },

      cleanup: () => {
        superCleanup();
      },
    };
  })

  .views(self => ({
    get list() {
      return values(self.userCapabilities);
    },
  }));

function registerContextItems(appContext) {
  appContext.userCapabilitiesStore = UserCapabilitiesStore.create({}, appContext);
}

export { UserCapabilitiesStore, registerContextItems };
