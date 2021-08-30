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

import { inject, observer } from 'mobx-react';
import React from 'react';
import i18n from 'roddeh-i18n';
import DetailsPage from '@aws-ee/base-ui/dist/parts/helpers/DetailsPage';
import keys from '../../../../vam-ui-i18n/dist';
import ApplicationsSection from '../shared/ApplicationsSection';
import GroupAccessSection from '../shared/GroupAccessSection';

// expected props
// - dynamicCatalogsStore (via injection)
class DynamicCatalogDetails extends DetailsPage {
  renderDetails(model) {
    return (
      <>
        <ApplicationsSection applications={model.applications} />
        <GroupAccessSection model={model} />
      </>
    );
  }

  getStore() {
    return this.props.dynamicCatalogsStore;
  }

  getModelName() {
    return i18n(keys.DYNAMIC_APPLICATION_CATALOGS);
  }

  getListPageLink() {
    return '/dynamic-catalogs';
  }
}

export default inject('dynamicCatalogsStore')(observer(DynamicCatalogDetails));
