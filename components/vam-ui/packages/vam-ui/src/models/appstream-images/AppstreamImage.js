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
import _ from 'lodash';
import moment from 'moment';
import i18n from 'roddeh-i18n';
import keys from '../../../../vam-ui-i18n/dist';
import AppstreamApplication from '../appstream-applications/AppstreamApplication';
import { shareImage, revokeImageSharing } from '../../helpers/api';

const AppstreamImage = types
  .model('AppstreamImage', {
    name: types.identifier,
    arn: types.optional(types.string, ''),
    displayName: types.string,
    state: types.string,
    applications: types.array(AppstreamApplication),
    sharedAccounts: types.array(types.string),
    dapEnabled: types.optional(types.boolean, false),
    platform: types.string,
    createdTime: types.string,
    workflowId: types.optional(types.string, ''),
    instanceId: types.optional(types.string, ''),
  })
  .views(self => ({
    get id() {
      return self.name;
    },
    get title() {
      return self.displayName;
    },
    get description() {
      return self.displayName;
    },
    get created() {
      return moment(self.createdTime).format(i18n(keys.DATE_TIME_FORMAT));
    },
    get isProcessing() {
      return _.toUpper(self.state) === AppstreamImage.states.PROCESSING;
    },
    get isPending() {
      return _.toUpper(self.state) === AppstreamImage.states.PENDING;
    },
    get isAvailable() {
      return _.toUpper(self.state) === AppstreamImage.states.AVAILABLE;
    },
    get isFailed() {
      return _.toUpper(self.state) === AppstreamImage.states.FAILED;
    },
    get statusLabel() {
      switch (self.state) {
        case AppstreamImage.states.PROCESSING:
          return i18n(keys.PROCESSING);
        case AppstreamImage.states.PENDING:
          return i18n(keys.PROCESSING);
        case AppstreamImage.states.AVAILABLE:
          return i18n(keys.AVAILABLE);
        case AppstreamImage.states.FAILED:
          return i18n(keys.FAILED);
        default:
          return i18n(keys.UNKNOWN);
      }
    },
  }))
  .actions(self => ({
    async shareWithAwsAccount(accountId) {
      await shareImage({ imageName: self.name, accountId });
      this.addSharedAccount(accountId);
    },
    async revokeSharingWithAwsAccount(accountId) {
      await revokeImageSharing({ imageName: self.name, accountId });
      this.removeSharedAccount(accountId);
    },
    addSharedAccount(accountId) {
      if (self.sharedAccounts.indexOf(accountId) === -1) {
        self.sharedAccounts.push(accountId);
      }
    },
    removeSharedAccount(accountId) {
      self.sharedAccounts.remove(accountId);
    },
  }));

AppstreamImage.states = {
  AVAILABLE: 'AVAILABLE',
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  FAILED: 'FAILED',
};

export default AppstreamImage;
