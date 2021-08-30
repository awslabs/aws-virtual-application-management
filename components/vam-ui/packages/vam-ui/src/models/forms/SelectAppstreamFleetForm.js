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

const selectAppstreamFleetsForm = fleetOptions => {
  return {
    // General fields
    appstream_fleet: {
      label: i18n(keys.APPSTREAM_FLEETS),
      extra: {
        options: fleetOptions,
      },
    },
  };
};

const getSelectAppstreamFleetsForm = fleets => {
  return createForm(selectAppstreamFleetsForm(fleets));
};

export { getSelectAppstreamFleetsForm }; // eslint-disable-line import/prefer-default-export
