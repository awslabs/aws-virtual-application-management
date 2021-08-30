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
import { runInAction } from 'mobx';
import React from 'react';
import { Container, Header, Button } from 'semantic-ui-react';
import i18n from 'roddeh-i18n';
import DropDown from '@aws-ee/base-ui/dist/parts/helpers/fields/DropDown';
import { displayError } from '@aws-ee/base-ui/dist/helpers/notification';
import Form from '@aws-ee/base-ui/dist/parts/helpers/fields/Form';
import ErrorBox from '@aws-ee/base-ui/dist/parts/helpers/ErrorBox';
import BasicProgressPlaceholder from '@aws-ee/base-ui/dist/parts/helpers/BasicProgressPlaceholder';
import { isStoreError, isStoreLoading, isStoreReady } from '@aws-ee/base-ui/dist/models/BaseStore';
import { swallowError } from '@aws-ee/base-ui/dist/helpers/utils';
import { gotoFn } from '@aws-ee/base-ui/dist/helpers/routing';
import Stores from '@aws-ee/base-ui/dist/models/Stores';
import baseKeys from '@aws-ee/base-ui-i18n';
import keys from '../../../../vam-ui-i18n/dist';
import { getSelectAppstreamFleetsForm } from '../../models/forms/SelectAppstreamFleetForm';

// expected props
// - appstreamFleetsStore (via injection)
class SelectAppstreamFleet extends React.Component {
  constructor(props) {
    super(props);
    this.goto = gotoFn(this);
    runInAction(() => {
      this.stores = new Stores([this.getStore(), this.props.appstreamImagesStore]);
    });
  }

  componentDidMount() {
    swallowError(this.stores.load());
  }

  getStore() {
    return this.props.appstreamFleetsStore;
  }

  render() {
    const store = this.getStore();
    let content = null;
    if (isStoreError(store)) {
      content = <ErrorBox error={store.error} />;
    } else if (isStoreLoading(store)) {
      content = <BasicProgressPlaceholder segmentCount={1} />;
    } else if (isStoreReady(store)) {
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
          {i18n(keys.SELECT_FLEET)}
        </Header>
        {this.renderForm()}
      </>
    );
  }

  getDropdownOptions() {
    const fleets = this.props.appstreamFleetsStore.list;
    const imageStore = this.props.appstreamImagesStore;
    const options = fleets
      .filter(fleet => {
        const image = imageStore.getById(fleet.imageName);
        return image && image.dapEnabled;
      })
      .map(fleet => {
        return {
          key: fleet.id,
          value: fleet.id,
          text: fleet.id,
        };
      });
    return options;
  }

  renderForm() {
    const fleets = this.getDropdownOptions();
    const form = getSelectAppstreamFleetsForm(fleets);
    return (
      <Form
        form={form}
        onSuccess={this.handleFormSubmission}
        onCancel={() => {
          this.goto('/dynamic-catalogs');
        }}
      >
        {({ processing, _onSubmit, onCancel }) => {
          return (
            <>
              <DropDown field={form.$('appstream_fleet')} fluid selection data-testid="fleet" />
              <Button
                className="ml2 mb3"
                floated="right"
                color="blue"
                icon
                disabled={processing}
                type="submit"
                data-testid="select-fleet-button"
              >
                {i18n(keys.SELECT_FLEET)}
              </Button>
              <Button className="mb3" floated="right" disabled={processing} onClick={onCancel}>
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
      this.goto(`/dynamic-catalogs/create/${values.appstream_fleet}`);
    } catch (error) {
      displayError(error);
    }
  };
}

export default inject('appstreamFleetsStore', 'appstreamImagesStore')(observer(SelectAppstreamFleet));
