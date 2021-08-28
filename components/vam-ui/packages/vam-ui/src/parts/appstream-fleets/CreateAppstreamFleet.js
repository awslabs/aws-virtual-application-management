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
import { runInAction, observable, decorate } from 'mobx';
import React from 'react';
import { Container, Header, Button, Divider } from 'semantic-ui-react';
import i18n from 'roddeh-i18n';
import { displaySuccess, displayError } from '@aws-ee/base-ui/dist/helpers/notification';
import Form from '@aws-ee/base-ui/dist/parts/helpers/fields/Form';
import Input from '@aws-ee/base-ui/dist/parts/helpers/fields/Input';
import DropDown from '@aws-ee/base-ui/dist/parts/helpers/fields/DropDown';
import ErrorBox from '@aws-ee/base-ui/dist/parts/helpers/ErrorBox';
import BasicProgressPlaceholder from '@aws-ee/base-ui/dist/parts/helpers/BasicProgressPlaceholder';
import { isStoreError, isStoreLoading, isStoreReady } from '@aws-ee/base-ui/dist/models/BaseStore';
import Stores from '@aws-ee/base-ui/dist/models/Stores';
import { gotoFn } from '@aws-ee/base-ui/dist/helpers/routing';
import baseKeys from '@aws-ee/base-ui-i18n';
import keys from '../../../../vam-ui-i18n/dist';

import { getCreateAppstreamFleetForm } from '../../models/forms/CreateAppstreamFleetForm';

// expected props
// - appstreamImagesStore (via injection)
class CreateAppstreamFleet extends React.Component {
  constructor(props) {
    super(props);
    this.goto = gotoFn(this);
    runInAction(() => {
      this.stores = new Stores([this.getStore(), this.props.appstreamImagesStore]);
    });
  }

  componentDidMount() {
    this.stores.load();
  }

  getStore() {
    return this.props.appstreamFleetsStore;
  }

  getStores() {
    return this.stores;
  }

  render() {
    const stores = this.getStores();
    let content = null;
    if (isStoreError(stores)) {
      content = <ErrorBox error={stores.error} />;
    } else if (isStoreLoading(stores)) {
      content = <BasicProgressPlaceholder segmentCount={1} />;
    } else if (isStoreReady(stores)) {
      content = this.renderMain();
    }
    return (
      <Container className="mt3">
        <div className="mb4">{content}</div>
      </Container>
    );
  }

  renderMain() {
    return (
      <>
        <Header as="h1" color="grey" className="mt3">
          {i18n(keys.CREATE_FLEET)}
        </Header>
        {this.renderForm()}
      </>
    );
  }

  renderForm() {
    const images = this.props.appstreamImagesStore.dropdownOptions;
    const form = getCreateAppstreamFleetForm(images);
    return (
      <Form form={form} onSuccess={this.handleFormSubmission} onCancel={this.handleCancel}>
        {({ processing, _onSubmit, _onCancel }) => {
          return (
            <>
              <Input field={form.$('name')} data-testid="fleet-name" />
              <DropDown field={form.$('image')} fluid selection data-testid="image" />
              <DropDown field={form.$('instanceType')} fluid selection data-testid="instance-type" />
              <DropDown field={form.$('fleetType')} fluid selection data-testid="fleet-type" />
              <DropDown field={form.$('streamView')} fluid selection data-testid="stream-view" />
              <Header className="mt3" as="h3">
                {i18n(keys.USER_SESSION_DETAILS)}
              </Header>
              <Divider />
              <Input field={form.$('maxUserDurationInMinutes')} data-testid="max-user-duration" />
              <Input field={form.$('disconnectTimeoutInMinutes')} data-testid="disconnect-timeout" />
              <Input field={form.$('idleDisconnectTimeoutInMinutes')} data-testid="idle-disconnect-timeout" />
              <Header className="mt3" as="h3">
                {i18n(keys.FLEET_SCALING_DETAILS)}
              </Header>
              <Divider />
              <Input field={form.$('desiredCapacity')} data-testid="desired-capacity" />
              <Button
                className="ml2 mb3"
                floated="right"
                color="blue"
                icon
                disabled={processing}
                type="submit"
                data-testid="create-fleet-button"
              >
                {i18n(keys.CREATE_FLEET)}
              </Button>
              <Button className="mb3" floated="right" disabled={processing} onClick={this.handleCancel}>
                {i18n(baseKeys.CANCEL)}
              </Button>
            </>
          );
        }}
      </Form>
    );
  }

  handleFormSubmission = async form => {
    try {
      const values = form.values();
      await this.props.appstreamFleetsStore.createAppstreamFleet(values);
      displaySuccess(i18n(keys.FLEET_CREATION_SUCCESS));
      this.goto(`/appstream-fleets`);
    } catch (error) {
      displayError(error);
    }
  };

  handleCancel = () => {
    this.goto(`/appstream-fleets`);
  };
}

decorate(CreateAppstreamFleet, {
  stores: observable,
});

export default inject('appstreamImagesStore', 'appstreamFleetsStore')(observer(CreateAppstreamFleet));
