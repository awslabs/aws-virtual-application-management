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
import { observable, runInAction, decorate } from 'mobx';
import React from 'react';
import { Checkbox, Container, Header, Button, Image } from 'semantic-ui-react';
import i18n from 'roddeh-i18n';
import SelectableTable from '@aws-ee/base-ui/dist/parts/helpers/SelectableTable';
import { displaySuccess, displayError } from '@aws-ee/base-ui/dist/helpers/notification';
import Form from '@aws-ee/base-ui/dist/parts/helpers/fields/Form';
import Input from '@aws-ee/base-ui/dist/parts/helpers/fields/Input';
import DropDown from '@aws-ee/base-ui/dist/parts/helpers/fields/DropDown';
import CustomInput from '@aws-ee/base-ui/dist/parts/helpers/fields/CustomInput';
import ErrorBox from '@aws-ee/base-ui/dist/parts/helpers/ErrorBox';
import BasicProgressPlaceholder from '@aws-ee/base-ui/dist/parts/helpers/BasicProgressPlaceholder';
import { isStoreError, isStoreLoading, isStoreReady } from '@aws-ee/base-ui/dist/models/BaseStore';
import Stores from '@aws-ee/base-ui/dist/models/Stores';
import { gotoFn } from '@aws-ee/base-ui/dist/helpers/routing';
import baseKeys from '@aws-ee/base-ui-i18n';
import keys from '../../../../vam-ui-i18n/dist';
import { getCreateAppstreamImageForm } from '../../models/forms/CreateAppstreamImageForm';
import { adJoined } from '../../helpers/settings';

// expected props
// - appstreamImagesStore (via injection)
class CreateAppstreamImage extends React.Component {
  constructor(props) {
    super(props);
    this.goto = gotoFn(this);

    this.componentStore = observable({
      dapEnabled: adJoined,
      deleteImageBuilder: true,
      snapshotImage: true,
    });

    runInAction(() => {
      this.stores = new Stores([
        this.getStore(),
        this.props.appstreamImagesStore,
        this.props.appstreamImageBuildersStore,
      ]);
    });
  }

  componentDidMount() {
    this.stores.load();
  }

  getStore() {
    return this.props.appstreamApplicationsStore;
  }

  getStores() {
    return this.stores;
  }

  getModel() {
    return this.props.appstreamImagesStore.getById(this.getModelId());
  }

  getModelId() {
    return decodeURIComponent((this.props.match.params || {}).modelId);
  }

  render() {
    const stores = this.stores;
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
          {i18n(keys.CREATE_IMAGE)}
        </Header>
        {this.renderForm()}
      </>
    );
  }

  renderForm() {
    const model = this.getModel();
    let applicationsValue = [];
    let imageName = '';
    if (model) {
      applicationsValue = model.applications.map(a => a.infoPath);
      imageName = `${model.name}-Copy`;
    }

    const imageBuilderIDs = this.props.appstreamImageBuildersStore.dropdownOptions;
    imageBuilderIDs.unshift({
      key: '',
      value: '',
      text: '',
    });

    const baseImageArns = this.props.appstreamImagesStore.dropdownOptionsWithArn;
    baseImageArns.unshift({
      key: '',
      value: '',
      text: '',
    });

    const form = getCreateAppstreamImageForm({ imageName }, { imageBuilderIDs, baseImageArns });
    const applications = this.props.appstreamApplicationsStore.list;

    return (
      <Form form={form} onSuccess={this.handleFormSubmission} onCancel={this.handleCancel}>
        {({ processing, _onSubmit, _onCancel }) => {
          return (
            <>
              <Input field={form.$('imageName')} data-testid="image-name" />
              <DropDown field={form.$('instanceType')} fluid selection data-testid="instance-type" />
              <CustomInput field={form.$('applications')}>
                <SelectableTable
                  defaultValue={applicationsValue}
                  rowData={applications}
                  data-testid="applications"
                  headerRenderer={() => {
                    return [i18n(keys.ICON), i18n(keys.NAME)];
                  }}
                  rowRenderer={row => {
                    return [<Image src={row.iconUrl} width="20" height="20" />, row.displayName];
                  }}
                  valueMethod={row => {
                    return row.id;
                  }}
                />
              </CustomInput>
              {adJoined && (
                <div className="mb2">
                  <Checkbox
                    toggle
                    defaultChecked={this.componentStore.dapEnabled}
                    label={i18n(keys.DAP_ENABLED)}
                    field={form.$('dapEnabled')}
                    data-testid="dap-enabled"
                    onClick={this.handleToggleChange('dapEnabled')}
                  />
                </div>
              )}
              <Header as="h3">{i18n(keys.ADVANCED_SETTINGS)}</Header>
              <DropDown field={form.$('baseImageArn')} fluid selection data-testid="base-image-arn" />
              <DropDown field={form.$('imageBuilderID')} fluid selection data-testid="image-builder-id" />
              <div className="m2">
                <Checkbox
                  toggle
                  defaultChecked={this.componentStore.snapshotImage}
                  label={i18n(keys.SNAPSHOT_IMAGE)}
                  field={form.$('snapshotImage')}
                  data-testid="snapshot-enabled"
                  onClick={this.handleToggleChange('snapshotImage')}
                />
              </div>
              <div className="m2">
                <Checkbox
                  toggle
                  defaultChecked={this.componentStore.deleteImageBuilder}
                  label={i18n(keys.DELETE_IMAGE_BUILDER)}
                  field={form.$('deleteImageBuilder')}
                  data-testid="delete-image-builder-enabled"
                  onClick={this.handleToggleChange('deleteImageBuilder')}
                />
              </div>
              <Button
                className="ml2 mb3"
                floated="right"
                color="blue"
                icon
                disabled={processing}
                type="submit"
                data-testid="create-image-button"
              >
                {i18n(keys.CREATE_IMAGE)}
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

  handleToggleChange = field => {
    return (onChange, event) => {
      runInAction(() => {
        this.componentStore[field] = event.checked;
      });
    };
  };

  handleFormSubmission = async form => {
    try {
      const values = form.values();
      values.dapEnabled = this.componentStore.dapEnabled;
      values.snapshotImage = this.componentStore.snapshotImage;
      values.deleteImageBuilder = this.componentStore.deleteImageBuilder;
      await this.props.appstreamImagesStore.createAppstreamImage(values);
      displaySuccess(i18n(keys.IMAGE_CREATION_SUCCESS));
      this.goto(`/appstream-images`);
    } catch (error) {
      displayError(error);
    }
  };

  handleCancel = () => {
    this.goto(`/appstream-images`);
  };
}

decorate(CreateAppstreamImage, {
  stores: observable,
  dapEnabled: observable,
});

export default inject(
  'appstreamImagesStore',
  'appstreamApplicationsStore',
  'appstreamImageBuildersStore',
)(observer(CreateAppstreamImage));
