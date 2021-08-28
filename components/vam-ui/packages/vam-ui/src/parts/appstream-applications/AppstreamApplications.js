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
import { Image } from 'semantic-ui-react';
import i18n from 'roddeh-i18n';

import ListPage from '@aws-ee/base-ui/dist/parts/helpers/ListPage';
import SimpleTable from '@aws-ee/base-ui/dist/parts/helpers/SimpleTable';
import keys from '../../../../vam-ui-i18n/dist';

class AppstreamApplications extends ListPage {
  getStore() {
    return this.props.appstreamApplicationsStore;
  }

  getDocumentationUrl() {
    return 'user_guide/sidebar/common/applications/introduction';
  }

  getIconType() {
    return 'play circle outline';
  }

  renderTitleText() {
    return i18n(keys.APPLICATIONS);
  }

  renderMain() {
    const list = this.getStore().list;

    return (
      <>
        {this.renderTitle()}
        <SimpleTable
          rowData={list}
          headerRenderer={() => {
            return [i18n(keys.ICON), i18n(keys.NAME)];
          }}
          rowRenderer={row => {
            return [<Image src={row.iconUrl} width="20" height="20" />, row.displayName];
          }}
        />
      </>
    );
  }

  renderEmptyText() {
    return i18n(keys.EMPTY_APPLICATIONS);
  }
}

export default inject('appstreamApplicationsStore')(withRouter(observer(AppstreamApplications)));
