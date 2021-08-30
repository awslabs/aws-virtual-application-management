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

import React, { Component } from 'react';
import i18n from 'roddeh-i18n';
import { Image } from 'semantic-ui-react';
import SimpleTable from '@aws-ee/base-ui/dist/parts/helpers/SimpleTable';
import DetailsPageSection from '@aws-ee/base-ui/dist/parts/helpers/DetailsPageSection';
import keys from '../../../../vam-ui-i18n/dist';

// expected props
// - model
class ApplicationsSection extends Component {
  render() {
    return (
      <DetailsPageSection
        title={i18n(keys.APPLICATIONS)}
        content={
          <SimpleTable
            rowData={this.props.applications}
            headerRenderer={() => {
              return [i18n(keys.ICON), i18n(keys.ID), i18n(keys.NAME)];
            }}
            rowRenderer={row => {
              return [<Image src={row.iconUrl} width="20" height="20" />, row.id, row.displayName];
            }}
          />
        }
      />
    );
  }
}

export default ApplicationsSection;
