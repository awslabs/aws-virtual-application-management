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
import { Container, Header, Button, Image } from 'semantic-ui-react';
import i18n from 'roddeh-i18n';
import SelectableTable from '@aws-ee/base-ui/dist/parts/helpers/SelectableTable';
import { displaySuccess, displayError } from '@aws-ee/base-ui/dist/helpers/notification';
import Form from '@aws-ee/base-ui/dist/parts/helpers/fields/Form';
import Input from '@aws-ee/base-ui/dist/parts/helpers/fields/Input';
import CustomInput from '@aws-ee/base-ui/dist/parts/helpers/fields/CustomInput';
import ErrorBox from '@aws-ee/base-ui/dist/parts/helpers/ErrorBox';
import BasicProgressPlaceholder from '@aws-ee/base-ui/dist/parts/helpers/BasicProgressPlaceholder';
import { isStoreError, isStoreLoading, isStoreReady } from '@aws-ee/base-ui/dist/models/BaseStore';
import Stores from '@aws-ee/base-ui/dist/models/Stores';
import { gotoFn } from '@aws-ee/base-ui/dist/helpers/routing';
import baseKeys from '@aws-ee/base-ui-i18n';
import keys from '../../../../vam-ui-i18n/dist';
import { getCreateDynamicCatalogForm } from '../../models/forms/CreateDynamicCatalogForm';

// expected props
// - appstreamFleetsStore (via injection)
// - appstreamImagesStore (via injection)
// - dynamicCatalogsStore (via injection)
class CreateDynamicCatalog extends React.Component {
  constructor(props) {
    super(props);
    this.goto = gotoFn(this);
    runInAction(() => {
      this.stores = new Stores([this.getStore(), this.props.appstreamFleetsStore, this.props.appstreamImagesStore]);
    });
  }

  componentDidMount() {
    this.stores.load();
  }

  getStore() {
    return this.props.dynamicCatalogsStore;
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
          {i18n(keys.CREATE_DYNAMIC_CATALOG)}
        </Header>
        {this.renderForm()}
      </>
    );
  }

  renderForm() {
    const form = getCreateDynamicCatalogForm();
    const image = this.getImage();
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
              <Input field={form.$('name')} data-testid="dyncat-name" />
              <CustomInput field={form.$('applications')}>
                <SelectableTable
                  rowData={image.applications}
                  data-testid="applications"
                  headerRenderer={() => {
                    return [i18n(keys.ICON), i18n(keys.NAME)];
                  }}
                  rowRenderer={row => {
                    return [<Image src={row.iconUrl} width="20" height="20" />, row.displayName];
                  }}
                  valueMethod={row => {
                    return row.infoPath;
                  }}
                />
              </CustomInput>
              <Button
                className="ml2 mb3"
                floated="right"
                color="blue"
                icon
                disabled={processing}
                type="submit"
                data-testid="create-dyncat-button"
              >
                {i18n(keys.CREATE_DYNAMIC_CATALOG)}
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

  getModelId() {
    return decodeURIComponent((this.props.match.params || {}).appstreamFleetId);
  }

  getModel() {
    return this.props.appstreamFleetsStore.getById(this.getModelId());
  }

  getImage() {
    return this.props.appstreamImagesStore.getById(this.getModel().imageName);
  }

  handleFormSubmission = async form => {
    try {
      const values = form.values();
      values.fleet = this.getModelId();
      await this.props.dynamicCatalogsStore.createDynamicCatalog(values);
      displaySuccess(i18n(keys.DYNAMIC_CATALOG_CREATED));
      this.goto('/dynamic-catalogs');
    } catch (error) {
      displayError(error);
    }
  };
}

decorate(CreateDynamicCatalog, {
  stores: observable,
});

export default inject(
  'appstreamFleetsStore',
  'appstreamImagesStore',
  'dynamicCatalogsStore',
)(observer(CreateDynamicCatalog));
