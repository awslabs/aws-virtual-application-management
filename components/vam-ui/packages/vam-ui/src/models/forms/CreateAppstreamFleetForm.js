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

import { createForm } from '@aws-ee/base-ui/dist/helpers/form';
import i18n from 'roddeh-i18n';
import keys from '../../../../vam-ui-i18n/dist';
import getInstanceTypes from './InstanceTypeHelper';

const createAppstreamFleetFields = imageOptions => {
  return {
    // General fields
    name: {
      label: i18n(keys.NAME),
      placeholder: i18n(keys.FORM_NAME_FLEET_PLACEHOLDER),
      rules: ['required', 'string', 'between:1,100', 'regex:/^[A-Za-z0-9-_ ]+$/'],
    },
    image: {
      label: i18n(keys.IMAGE),
      placeholder: i18n(keys.IMAGE_TO_USE),
      rules: ['required', 'string', 'min:1', 'max:100'],
      extra: {
        options: imageOptions,
      },
    },
    instanceType: {
      label: i18n(keys.INSTANCE_TYPE),
      extra: {
        options: getInstanceTypes(),
      },
    },
    fleetType: {
      label: i18n(keys.FLEET_TYPE),
      extra: {
        options: [
          {
            key: 'ALWAYS_ON',
            value: 'ALWAYS_ON',
            text: i18n(keys.ALWAYS_ON),
          },
          {
            key: 'ON_DEMAND',
            value: 'ON_DEMAND',
            text: i18n(keys.ON_DEMAND),
          },
        ],
      },
    },
    streamView: {
      label: i18n(keys.STREAM_VIEW),
      extra: {
        options: [
          {
            key: 'APP',
            value: 'APP',
            text: i18n(keys.APP),
          },
          {
            key: 'DESKTOP',
            value: 'DESKTOP',
            text: i18n(keys.DESKTOP),
          },
        ],
      },
    },
    maxUserDurationInMinutes: {
      label: i18n(keys.MAX_USER_DURATION),
      placeholder: i18n(keys.IN_MINUTES),
      rules: ['required', 'integer', 'between:10,6000'],
    },
    disconnectTimeoutInMinutes: {
      label: i18n(keys.DISCONNECT_TIME),
      placeholder: i18n(keys.IN_MINUTES),
      rules: ['required', 'integer', 'between:1,6000'],
    },
    idleDisconnectTimeoutInMinutes: {
      label: i18n(keys.IDLE_DISCONNECT_TIMEOUT),
      placeholder: i18n(keys.IN_MINUTES),
      rules: ['required', 'integer', 'between:0,60'],
    },
    desiredCapacity: {
      label: i18n(keys.DESIRED_CAPACITY),
      rules: ['required', 'integer', 'min:1'],
    },
  };
};

const getCreateAppstreamFleetForm = imageOptions => {
  return createForm(createAppstreamFleetFields(imageOptions));
};

export { getCreateAppstreamFleetForm }; // eslint-disable-line import/prefer-default-export
