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

import { getAppstreamApplications } from '../../helpers/api';
import AppstreamApplication from './AppstreamApplication';

const AppstreamApplicationsStore = BaseStore.named('AppstreamApplicationsStore')
  .props({
    appstreamApplications: types.optional(types.map(AppstreamApplication), {}),
    tickPeriod: 60 * 1000, // 60 seconds
  })
  .actions(self => {
    return {
      async doLoad() {
        const appstreamApplications = await getAppstreamApplications();
        self.runInAction(() => {
          const map = {};
          appstreamApplications.forEach(data => {
            const appstreamApplicationModel = AppstreamApplication.create(data);
            map[appstreamApplicationModel.id] = appstreamApplicationModel;
          });
          self.appstreamApplications.replace(map);
        });
      },
    };
  })
  .views(self => ({
    get empty() {
      return self.appstreamApplications.size === 0;
    },
    get list() {
      const result = [];
      // converting map self.apiKeys to result array
      self.appstreamApplications.forEach(app => {
        if (app.preinstalled) {
          result.push({ ...app, displayName: `${app.displayName} (preinstalled)` });
        } else {
          result.push(app);
        }
      });
      return result;
    },

    getById(id) {
      return self.appstreamApplications.get(id);
    },
  }));

function registerContextItems(appContext) {
  appContext.appstreamApplicationsStore = AppstreamApplicationsStore.create({}, appContext);
}

export { AppstreamApplicationsStore, registerContextItems };
