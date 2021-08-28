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
import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { Button, Header, Label } from 'semantic-ui-react';
import { gotoFn } from '@aws-ee/base-ui/dist/helpers/routing';
import i18n from 'roddeh-i18n';
import keys from '../../../../vam-ui-i18n/dist';
import AppstreamFleetActions from './AppstreamFleetActions';

// expected props
// - appstreamImage
// - pos
// eslint-disable-next-line react/prefer-stateless-function
class AppstreamFleetCard extends Component {
  componentDidMount() {
    this.goto = gotoFn(this);
  }

  render() {
    const model = this.props.appstreamFleet;
    return (
      <div className="flex" onClick={this.handleEditModeClick} data-testid="appstream-fleet-card">
        <div className="flex-auto">
          <div className="flex">
            {this.renderStatusLabel(model)}
            <Header as="h2" color="grey" className="mt0">
              {this.renderTitle(model)}
            </Header>
            <div className="ml-auto" data-testid="actions">
              <AppstreamFleetActions appstreamFleet={model}>
                <Button onClick={this.handleFleetDetails}>{i18n(keys.FLEET_DETAILS)}</Button>
              </AppstreamFleetActions>
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderTitle(model) {
    return model.name;
  }

  renderStatusLabel(model) {
    const color = this.getLabelColor(model);
    return (
      <Label size="mini" ribbon color={color} className="line-height-20-px">
        {model.statusLabel}
      </Label>
    );
  }

  getLabelColor(model) {
    if (model.isRunning) {
      return 'green';
    }
    if (model.isStarting) {
      return 'yellow';
    }
    return 'orange';
  }

  handleFleetDetails = _event => {
    const model = this.props.appstreamFleet;
    this.goto(`/appstream-fleets/details/${model.id}`);
  };
}

export default inject('appstreamFleetsStore')(withRouter(observer(AppstreamFleetCard)));
