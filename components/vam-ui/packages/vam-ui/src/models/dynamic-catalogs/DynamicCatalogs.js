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
import { types } from 'mobx-state-tree';
import AppstreamApplication from '../appstream-applications/AppstreamApplication';
import Group from '../groups/Group';
import { revokeGroupForDynamicCatalog, grantGroupForDynamicCatalog } from '../../helpers/api';

const DynamicCatalog = types
  .model('DynamicCatalog', {
    id: types.string,
    fleet: types.string,
    applications: types.optional(types.array(AppstreamApplication), []),
    sharedGroups: types.optional(types.array(Group), []),
  })
  .views(self => ({
    get title() {
      return self.id;
    },
  }))
  .actions(self => ({
    async grantGroupAccess(groupId, groupName) {
      const group = await grantGroupForDynamicCatalog({ id: self.id, groupId, groupName });
      this.addGroup(group);
    },
    async revokeGroupAccess(groupId) {
      await revokeGroupForDynamicCatalog({ id: self.id, groupId });
      this.removeGroup(groupId);
    },
    addGroup(group) {
      self.sharedGroups.push(group);
    },
    removeGroup(groupId) {
      const ind = _.indexOf(self.sharedGroups, g => g.id === groupId);
      self.sharedGroups.splice(ind, 1);
    },
  }));

export default DynamicCatalog;
