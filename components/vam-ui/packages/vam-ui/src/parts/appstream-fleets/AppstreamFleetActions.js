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
import { observable, runInAction } from 'mobx';
import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { Button } from 'semantic-ui-react';
import { gotoFn } from '@aws-ee/base-ui/dist/helpers/routing';
import ConfirmationModal from '@aws-ee/base-ui/dist/parts/helpers/ConfirmationModal';
import MessageModal from '@aws-ee/base-ui/dist/parts/helpers/MessageModal';
import ComponentSwitch from '@aws-ee/base-ui/dist/parts/helpers/ComponentSwitch';
import i18n from 'roddeh-i18n';

import keys from '../../../../vam-ui-i18n/dist';
import TestLinkModal from './TestLinkModal';

// expected props
// - appstreamImage
// - pos
// eslint-disable-next-line react/prefer-stateless-function
class AppstreamFleetActions extends Component {
  constructor() {
    super();
    this.componentStore = observable({
      openStartModal: false,
      startFleetProcessing: false,
      openStopModal: false,
      stopFleetProcessing: false,
      openDeleteModal: false,
      deleteFleetProcessing: false,
      testFleetLink: '',
    });
  }

  componentDidMount() {
    this.goto = gotoFn(this);
  }

  render() {
    const model = this.props.appstreamFleet;
    return (
      <>
        <Button.Group basic size="mini">
          {this.props.children}
          <ComponentSwitch
            tests={[
              () =>
                (model.isRunning || model.isStarting) && (
                  <>
                    {model.isRunning && (
                      <Button onClick={this.handleTestFleet} data-testid="test-fleet-button">
                        {i18n(keys.TEST_FLEET)}
                      </Button>
                    )}
                    <Button onClick={this.handleStopFleet} data-testid="stop-fleet-button">
                      {i18n(keys.STOP_FLEET)}
                    </Button>
                  </>
                ),
              () =>
                (model.isStopped || model.isStopping) && (
                  <>
                    <Button onClick={this.handleStartFleet} data-testid="start-fleet-button">
                      {i18n(keys.START_FLEET)}
                    </Button>
                    {model.isStopped && (
                      <Button onClick={this.handleDeleteFleet} data-testid="delete-fleet-button">
                        {i18n(keys.DELETE_FLEET)}
                      </Button>
                    )}
                  </>
                ),
            ]}
          />
        </Button.Group>
        {this.renderModals(model)}
      </>
    );
  }

  renderModals(model) {
    return (
      <>
        <ConfirmationModal
          open={this.componentStore.openStartModal}
          processing={this.componentStore.startFleetProcessing}
          header={i18n(keys.START_FLEET)}
          confirmLabel={i18n(keys.START_FLEET)}
          message={i18n(keys.START_FLEET_CONFIRMATION, {
            fleet: model.name,
          })}
          onConfirm={() => {
            runInAction(() => {
              this.componentStore.startFleetProcessing = true;
            });
            this.startFleet();
          }}
          onCancel={() => {
            this.closeModals();
          }}
        />
        <ConfirmationModal
          open={this.componentStore.openStopModal}
          processing={this.componentStore.stopFleetProcessing}
          header={i18n(keys.STOP_FLEET)}
          confirmLabel={i18n(keys.STOP_FLEET)}
          message={i18n(keys.STOP_FLEET_CONFIRMATION, {
            fleet: model.name,
          })}
          onConfirm={() => {
            runInAction(() => {
              this.componentStore.stopFleetProcessing = true;
            });
            this.stopFleet();
          }}
          onCancel={() => {
            this.closeModals();
          }}
        />
        <ConfirmationModal
          open={this.componentStore.openDeleteModal}
          processing={this.componentStore.deleteFleetProcessing}
          header={i18n(keys.DELETE_FLEET)}
          confirmLabel={i18n(keys.DELETE_FLEET)}
          message={i18n(keys.DELETE_FLEET_CONFIRMATION, {
            fleet: model.name,
          })}
          onConfirm={() => {
            runInAction(() => {
              this.componentStore.deleteFleetProcessing = true;
            });
            this.deleteFleet();
          }}
          onCancel={() => {
            this.closeModals();
          }}
        />
        {this.renderTestLinkModal(model)}
      </>
    );
  }

  renderTestLinkModal(model) {
    if (model.isDomainJoined) {
      return (
        <MessageModal
          open={this.componentStore.openTestFleetModal}
          header={i18n(keys.TEST_FLEET)}
          message={i18n(keys.TEST_FLEET_UNAVAILABLE)}
          onConfirm={() => {
            this.closeModals();
          }}
        />
      );
    }
    return (
      <TestLinkModal
        open={this.componentStore.openTestFleetModal}
        processing={this.componentStore.testFleetProcessing}
        link={this.componentStore.testFleetLink}
        onCancel={() => {
          this.closeModals();
        }}
      />
    );
  }

  handleTestFleet = async _event => {
    const model = this.props.appstreamFleet;
    runInAction(() => {
      this.componentStore.openTestFleetModal = true;
      this.componentStore.testFleetProcessing = true;
    });
    const result = await model.getTestFleetLink();
    runInAction(() => {
      this.componentStore.testFleetProcessing = false;
      this.componentStore.testFleetLink = result.link;
    });
  };

  handleStopFleet = _event => {
    runInAction(() => {
      this.componentStore.openStopModal = true;
    });
  };

  handleStartFleet = _event => {
    runInAction(() => {
      this.componentStore.openStartModal = true;
    });
  };

  handleDeleteFleet = _event => {
    runInAction(() => {
      this.componentStore.openDeleteModal = true;
    });
  };

  closeModals() {
    runInAction(() => {
      this.componentStore.openStartModal = false;
      this.componentStore.startFleetProcessing = false;
      this.componentStore.openStopModal = false;
      this.componentStore.stopFleetProcessing = false;
      this.componentStore.openDeleteModal = false;
      this.componentStore.deleteFleetProcessing = false;
      this.componentStore.openTestFleetModal = false;
      this.componentStore.testFleetLink = '';
    });
  }

  async startFleet() {
    const model = this.props.appstreamFleet;
    await model.startFleet();
    this.closeModals();
  }

  async stopFleet() {
    const model = this.props.appstreamFleet;
    await model.stopFleet();
    this.closeModals();
  }

  async deleteFleet() {
    await this.props.appstreamFleetsStore.deleteFleet(this.props.appstreamFleet.name);
    this.closeModals();
    this.goto(`/appstream-fleets`);
  }
}

export default inject('appstreamFleetsStore')(withRouter(observer(AppstreamFleetActions)));
