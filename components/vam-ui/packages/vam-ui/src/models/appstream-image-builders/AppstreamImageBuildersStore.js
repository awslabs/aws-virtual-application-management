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

import { getAppstreamImageBuilders } from '../../helpers/api';
import AppstreamImageBuilder from './AppstreamImageBuilder';

const AppstreamImageBuildersStore = BaseStore.named('AppstreamImageBuildersStore')
  .props({
    appstreamImageBuilders: types.optional(types.map(AppstreamImageBuilder), {}),
    tickPeriod: 60 * 1000, // 60 seconds
  })
  .actions(self => {
    return {
      async doLoad() {
        const appstreamImageBuilders = await getAppstreamImageBuilders();
        self.runInAction(() => {
          const map = {};
          appstreamImageBuilders.forEach(data => {
            const model = AppstreamImageBuilder.create(data);
            map[model.id] = model;
          });
          self.appstreamImageBuilders.replace(map);
        });
      },
    };
  })
  .views(self => ({
    get empty() {
      return self.appstreamImageBuilders.size === 0;
    },
    get list() {
      const result = [];
      // converting map self.apiKeys to result array
      self.appstreamImageBuilders.forEach(appstreamImageBuilder => result.push(appstreamImageBuilder));
      return result;
    },

    getById(id) {
      return self.appstreamImageBuilders.get(id);
    },

    get dropdownOptions() {
      const result = [];
      // converting map self.users to result array
      self.appstreamImageBuilders.forEach(ib => {
        result.push({
          key: ib.id,
          value: ib.id,
          text: ib.id,
        });
      });
      return result;
    },
  }));

function registerContextItems(appContext) {
  appContext.appstreamImageBuildersStore = AppstreamImageBuildersStore.create({}, appContext);
}

export { AppstreamImageBuildersStore, registerContextItems };
