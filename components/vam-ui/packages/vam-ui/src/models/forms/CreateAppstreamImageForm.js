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
import { createForm } from '@aws-ee/base-ui/dist/helpers/form';
import i18n from 'roddeh-i18n';
import keys from '../../../../vam-ui-i18n/dist';
import getInstanceTypes from './InstanceTypeHelper';

const createAppstreamImageFields = (defaultValues = {}, { imageBuilderIDs, baseImageArns }) => {
  const fields = {
    // General fields
    imageName: {
      label: i18n(keys.NAME),
      placeholder: i18n(keys.FORM_NAME_APPSTREAM_PLACEHOLDER),
      rules: ['required', 'string', 'between:3,100', 'regex:/^[A-Za-z][A-Za-z0-9-]+$/'],
      value: 'abc',
    },
    instanceType: {
      label: i18n(keys.IMAGE_BUILDER_INSTANCE_TYPE),
      extra: {
        options: getInstanceTypes(),
      },
    },
    applications: {
      label: i18n(keys.APPLICATIONS),
    },
    dapEnabled: {
      label: i18n(keys.DAP_ENABLED),
    },
    baseImageArn: {
      label: i18n(keys.BASE_IMAGE),
      extra: {
        options: baseImageArns,
      },
      placeholder: i18n(keys.BASE_IMAGE_DESCRIPTION),
    },
    imageBuilderID: {
      label: i18n(keys.IMAGE_BUILDER_ID),
      extra: {
        options: imageBuilderIDs,
      },
      placeholder: i18n(keys.IMAGE_BUILDER_ID_DESCRIPTION),
    },
    snapshotImage: {
      label: i18n(keys.SNAPSHOT_IMAGE),
    },
    deleteImageBuilder: {
      label: i18n(keys.DELETE_IMAGE_BUILDER),
    },
  };

  _.forEach(defaultValues, (value, key) => {
    fields[key].value = defaultValues[key];
  });
  return fields;
};

const getCreateAppstreamImageForm = (defaultValues, { imageBuilderIDs, baseImageArns }) => {
  return createForm(createAppstreamImageFields(defaultValues, { imageBuilderIDs, baseImageArns }));
};

export { getCreateAppstreamImageForm }; // eslint-disable-line import/prefer-default-export
