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

import React from 'react';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import i18n from 'roddeh-i18n';
import ListPage from '@aws-ee/base-ui/dist/parts/helpers/ListPage';
import keys from '../../../../vam-ui-i18n/dist';

import AppstreamImageCard from './AppstreamImageCard';

class AppstreamImages extends ListPage {
  getStore() {
    return this.props.appstreamImagesStore;
  }

  getDocumentationUrl() {
    return 'user_guide/sidebar/common/images/introduction';
  }

  getIconType() {
    return 'image outline';
  }

  renderTitleText() {
    return i18n(keys.APPSTREAM_IMAGES);
  }

  renderHeaderButtons() {
    return this.renderNavButton(i18n(keys.CREATE_IMAGE), '/appstream-images/create', {
      'data-testid': 'create-image-button',
    });
  }

  renderListItem(model, index) {
    return <AppstreamImageCard appstreamImage={model} pos={index + 1} />;
  }

  renderEmptyText() {
    return i18n(keys.EMPTY_APPSTREAM_IMAGES);
  }
}

export default inject('appstreamImagesStore')(withRouter(observer(AppstreamImages)));
