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
import moment from 'moment';
import i18n from 'roddeh-i18n';
import keys from '../../../../vam-ui-i18n/dist';
import Group from '../groups/Group';
import {
  startFleet,
  stopFleet,
  getTestFleetLink,
  grantGroupForFleet,
  revokeGroupForFleet,
  swapImage,
} from '../../helpers/api';

const ComputedCapacityStatus = types.model('ComputedCapacityStatus', {
  desired: types.number,
  running: types.number,
  inUse: types.number,
  available: types.number,
});

const DomainJoinInfo = types.model('DomainJoinInfo', {
  directoryName: types.string,
  organizationalUnitDistinguishedName: types.string,
});

const AppstreamFleet = types
  .model('AppstreamFleet', {
    name: types.identifier,
    imageName: types.string,
    state: types.string,
    instanceType: types.string,
    fleetType: types.string,
    maxUserDurationInSeconds: types.number,
    disconnectTimeoutInSeconds: types.number,
    idleDisconnectTimeoutInSeconds: types.number,
    createdTime: types.string,
    computeCapacityStatus: ComputedCapacityStatus,
    sharedGroups: types.optional(types.array(Group), []),
    domainJoinInfo: types.maybeNull(DomainJoinInfo),
  })
  .views(self => ({
    get id() {
      return self.name;
    },
    get title() {
      return self.name;
    },
    get maxUserDuration() {
      return Math.round(self.maxUserDurationInSeconds / 60);
    },
    get disconnectTimeout() {
      return Math.round(self.disconnectTimeoutInSeconds / 60);
    },
    get idleDisconnectTimeout() {
      return Math.round(self.idleDisconnectTimeoutInSeconds / 60);
    },
    get created() {
      return moment(self.createdTime).format(i18n(keys.DATE_TIME_FORMAT));
    },

    get isRunning() {
      return self.state === AppstreamFleet.states.RUNNING;
    },
    get isStarting() {
      return self.state === AppstreamFleet.states.STARTING;
    },
    get isStopped() {
      return self.state === AppstreamFleet.states.STOPPED;
    },
    get isStopping() {
      return self.state === AppstreamFleet.states.STOPPING;
    },
    get statusLabel() {
      switch (self.state) {
        case AppstreamFleet.states.RUNNING:
          return i18n(keys.RUNNING);
        case AppstreamFleet.states.STARTING:
          return i18n(keys.STARTING);
        case AppstreamFleet.states.STOPPING:
          return i18n(keys.STOPPING);
        case AppstreamFleet.states.STOPPED:
          return i18n(keys.STOPPED);
        default:
          return '';
      }
    },
    get fleetTypeLabel() {
      switch (self.fleetType) {
        case AppstreamFleet.instanceTypes.ALWAYS_ON:
          return i18n(keys.ALWAYS_ON);
        case AppstreamFleet.instanceTypes.ON_DEMAND:
          return i18n(keys.ON_DEMAND);
        default:
          return '';
      }
    },
    get isDomainJoined() {
      return self.domainJoinInfo !== null;
    },
  }))
  .actions(self => ({
    async startFleet() {
      await startFleet({ fleetName: self.name });
      self.updateState(AppstreamFleet.states.STARTING);
    },
    async stopFleet() {
      await stopFleet({ fleetName: self.name });
      self.updateState(AppstreamFleet.states.STOPPING);
    },
    updateState(state) {
      self.state = state;
    },
    async getTestFleetLink() {
      return getTestFleetLink({ fleetName: self.name });
    },
    async grantGroupAccess(groupId, groupName) {
      const group = await grantGroupForFleet({ fleetName: self.name, groupId, groupName });
      this.addGroup(group);
    },
    async revokeGroupAccess(groupId) {
      await revokeGroupForFleet({ fleetName: self.name, groupId });
      this.removeGroup(groupId);
    },
    async swapImage(imageName) {
      await swapImage({ fleetName: self.name, imageName });
      this.completeSwap(imageName);
    },
    completeSwap(imageName) {
      self.imageName = imageName;
    },
    addGroup(group) {
      self.sharedGroups.push(group);
    },
    removeGroup(groupId) {
      const ind = _.indexOf(self.sharedGroups, g => g.id === groupId);
      self.sharedGroups.splice(ind, 1);
    },
  }));

AppstreamFleet.states = {
  RUNNING: 'RUNNING',
  STARTING: 'STARTING',
  STOPPING: 'STOPPING',
  STOPPED: 'STOPPED',
};

AppstreamFleet.instanceTypes = {
  ALWAYS_ON: 'ALWAYS_ON',
  ON_DEMAND: 'ON_DEMAND',
};

export default AppstreamFleet;
