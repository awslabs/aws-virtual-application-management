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

import { types } from 'mobx-state-tree';
import { BaseStore } from '@aws-ee/base-ui/dist/models/BaseStore';

import { getGroups } from '../../helpers/api';
import Group from './Group';

const GroupsStore = BaseStore.named('GroupsStore')
  .props({
    groups: types.optional(types.map(Group), {}),
    tickPeriod: 5 * 60 * 1000, // 5 minutes
  })
  .actions(self => {
    return {
      async doLoad() {
        const groups = await getGroups();
        self.runInAction(() => {
          const map = {};
          groups.forEach(data => {
            const groupModel = Group.create({
              id: data.dn,
              name: data.name,
            });
            map[groupModel.id] = groupModel;
          });
          self.groups.replace(map);
        });
      },
    };
  })
  .views(self => ({
    get empty() {
      return self.groups.size === 0;
    },
    get list() {
      const result = [];
      // converting map self.apiKeys to result array
      self.groups.forEach(group => result.push(group));
      return result;
    },

    getById(id) {
      return self.groups.get(id);
    },

    get dropdownOptions() {
      const result = [];
      // converting map self.users to result array
      self.groups.forEach(group => {
        result.push({
          key: group.id,
          value: group.id,
          text: group.id,
        });
      });
      return result;
    },
  }));

function registerContextItems(appContext) {
  appContext.groupsStore = GroupsStore.create({}, appContext);
}

export { GroupsStore, registerContextItems };
