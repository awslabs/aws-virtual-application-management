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

import { getAppstreamFleets, createAppstreamFleet, deleteFleet } from '../../helpers/api';
import AppstreamFleet from './AppstreamFleet';

const AppstreamFleetsStore = BaseStore.named('AppstreamFleetsStore')
  .props({
    appstreamFleets: types.optional(types.map(AppstreamFleet), {}),
    tickPeriod: 60 * 1000, // 60 seconds
  })
  .actions(self => {
    return {
      async doLoad() {
        const appstreamFleets = await getAppstreamFleets();
        self.runInAction(() => {
          const map = {};
          appstreamFleets.forEach(data => {
            const appstreamFleetModel = AppstreamFleet.create(data);
            map[appstreamFleetModel.id] = appstreamFleetModel;
          });
          self.appstreamFleets.replace(map);
        });
      },
      async createAppstreamFleet({
        name,
        image,
        instanceType,
        fleetType,
        streamView,
        maxUserDurationInMinutes,
        disconnectTimeoutInMinutes,
        idleDisconnectTimeoutInMinutes,
        desiredCapacity,
      }) {
        const data = await createAppstreamFleet({
          fleetName: name,
          imageName: image,
          instanceType,
          fleetType,
          streamView,
          maxUserDurationInMinutes,
          disconnectTimeoutInMinutes,
          idleDisconnectTimeoutInMinutes,
          desiredCapacity,
        });
        self.runInAction(() => {
          const appstreamFleet = AppstreamFleet.create(data.fleet);
          self.appstreamFleets.set(appstreamFleet.id, appstreamFleet);
        });
      },
      async deleteFleet(name) {
        await deleteFleet({ fleetName: name });
        self.runInAction(() => {
          self.appstreamFleets.delete(name);
        });
      },
    };
  })
  .views(self => ({
    get empty() {
      return self.appstreamFleets.size === 0;
    },
    get list() {
      const result = [];
      // converting map self.apiKeys to result array
      self.appstreamFleets.forEach(appstreamFleet => result.push(appstreamFleet));
      return result;
    },
    getById(id) {
      return self.appstreamFleets.get(id);
    },
    get dropdownOptions() {
      const result = [];
      self.appstreamFleets.forEach(fleet => {
        result.push({
          key: fleet.id,
          value: fleet.id,
          text: fleet.id,
        });
      });
      return result;
    },
  }));

function registerContextItems(appContext) {
  appContext.appstreamFleetsStore = AppstreamFleetsStore.create({}, appContext);
}

export { AppstreamFleetsStore, registerContextItems };
