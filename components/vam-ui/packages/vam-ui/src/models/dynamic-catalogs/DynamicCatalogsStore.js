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

import _ from 'lodash';
import { getDynamicCatalogs, createDynamicCatalog, deleteDynamicCatalog } from '../../helpers/api';
import DynamicCatalog from './DynamicCatalogs';

const DynamicCatalogsStore = BaseStore.named('DynamicCatalogsStore')
  .props({
    dynamicCatalogs: types.optional(types.map(DynamicCatalog), {}),
    tickPeriod: 60 * 1000, // 60 seconds
  })
  .actions(self => {
    return {
      async doLoad() {
        const dynamicCatalogs = await getDynamicCatalogs();
        self.runInAction(() => {
          const map = {};
          const userCreated = _.filter(dynamicCatalogs, dc => !dc.id.startsWith('magic||||'));
          userCreated.forEach(data => {
            const dynamicCatalogModel = DynamicCatalog.create(data);
            map[dynamicCatalogModel.id] = dynamicCatalogModel;
          });
          self.dynamicCatalogs.replace(map);
        });
      },
      async createDynamicCatalog({ name, fleet, applications }) {
        const data = await createDynamicCatalog({ dynamicCatalogName: name, fleet, applications });
        self.runInAction(() => {
          const dynamicCatalog = DynamicCatalog.create(data);
          self.dynamicCatalogs.set(dynamicCatalog.id, dynamicCatalog);
        });
      },
      async deleteDynamicCatalog(id) {
        await deleteDynamicCatalog({ id });
        self.runInAction(() => {
          self.dynamicCatalogs.delete(id);
        });
      },
    };
  })
  .views(self => ({
    get empty() {
      return self.dynamicCatalogs.size === 0;
    },
    get list() {
      const result = [];
      // converting map self.apiKeys to result array
      self.dynamicCatalogs.forEach(app => result.push(app));
      return result;
    },

    hasDynamicCatalog(dynamicCatalogId) {
      return self.dynamicCatalogs.has(dynamicCatalogId);
    },

    getById(id) {
      return self.dynamicCatalogs.get(id);
    },
  }));

function registerContextItems(appContext) {
  appContext.dynamicCatalogsStore = DynamicCatalogsStore.create({}, appContext);
}

export { DynamicCatalogsStore, registerContextItems };
