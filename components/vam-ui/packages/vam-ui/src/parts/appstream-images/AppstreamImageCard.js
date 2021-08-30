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

import { observable, runInAction } from 'mobx';
import { inject, observer } from 'mobx-react';
import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import { Button, Header, Label } from 'semantic-ui-react';
import { gotoFn } from '@aws-ee/base-ui/dist/helpers/routing';
import ConfirmationModal from '@aws-ee/base-ui/dist/parts/helpers/ConfirmationModal';
import i18n from 'roddeh-i18n';
import { displayError } from '@aws-ee/base-ui/dist/helpers/notification';
import keys from '../../../../vam-ui-i18n/dist';

// expected props
// - appstreamImage
// - pos
// eslint-disable-next-line react/prefer-stateless-function
class AppstreamImageCard extends Component {
  constructor() {
    super();
    this.componentStore = observable({
      openDeleteModal: false,
      deleteImageProcessing: false,
    });
  }

  componentDidMount() {
    this.goto = gotoFn(this);
  }

  render() {
    const model = this.props.appstreamImage;
    return (
      <>
        <div className="flex" onClick={this.handleEditModeClick} data-testid="appstream-image-card">
          <div className="flex-auto">
            <div className="flex">
              {this.renderStatusLabel(model)}
              <Header as="h2" color="grey" className="mt0">
                {this.renderTitle(model)}
              </Header>
              <div className="ml-auto" data-testid="actions">
                {this.renderActionButtons(model)}
              </div>
            </div>
          </div>
        </div>
        {this.renderModals(model)}
      </>
    );
  }

  renderTitle(model) {
    return model.displayName;
  }

  renderStatusLabel(model) {
    return (
      <Label size="mini" ribbon color={this.getStatusColor(model)} className="line-height-20-px">
        {model.statusLabel}
      </Label>
    );
  }

  getStatusColor(model) {
    if (model.isAvailable) {
      return 'green';
    }
    if (model.isFailed) {
      return 'red';
    }
    return 'orange';
  }

  renderActionButtons(model) {
    const button =
      model.isProcessing || model.isPending || model.isFailed ? (
        <>
          <Button onClick={this.handleViewProgress}>{i18n(keys.VIEW_PROGRESS)}</Button>
          <Button onClick={this.handleDeleteImage} data-testid="delete-image-button">
            {i18n(keys.DELETE_IMAGE)}
          </Button>
        </>
      ) : (
        <>
          <Button onClick={this.handleDetails}>{i18n(keys.DETAILS)}</Button>
          <Button onClick={this.handleDeleteImage} data-testid="delete-image-button">
            {i18n(keys.DELETE_IMAGE)}
          </Button>
        </>
      );
    return (
      <Button.Group basic size="mini">
        {button}
      </Button.Group>
    );
  }

  renderModals(model) {
    return (
      <ConfirmationModal
        open={this.componentStore.openDeleteModal}
        processing={this.componentStore.deleteImageProcessing}
        header={i18n(keys.DELETE_IMAGE)}
        confirmLabel={i18n(keys.DELETE_IMAGE)}
        message={i18n(keys.DELETE_IMAGE_CONFIRMATION, {
          image: model.name,
        })}
        onConfirm={() => {
          runInAction(() => {
            this.componentStore.deleteImageProcessing = true;
          });
          this.deleteImage();
        }}
        onCancel={() => {
          this.closeModals();
        }}
      />
    );
  }

  handleDeleteImage = _event => {
    runInAction(() => {
      this.componentStore.openDeleteModal = true;
    });
  };

  closeModals() {
    runInAction(() => {
      this.componentStore.openDeleteModal = false;
      this.componentStore.deleteImageProcessing = false;
    });
  }

  async deleteImage() {
    try {
      await this.props.appstreamImagesStore.deleteImage(this.props.appstreamImage.name);
    } catch (e) {
      displayError(e.message);
    } finally {
      this.closeModals();
    }
  }

  handleViewProgress = event => {
    const model = this.props.appstreamImage;
    this.handleNavigate(event, `/workflows/published/id/${model.workflowId}/v/1/instances/id/${model.instanceId}`);
  };

  handleDetails = event => {
    const model = this.props.appstreamImage;
    this.handleNavigate(event, `/appstream-images/details/${encodeURIComponent(model.id)}`);
  };

  handleNavigate(event, link) {
    event.preventDefault();
    event.stopPropagation();
    const _id = this.props.appstreamImage.name;
    this.goto(link);
  }
}

export default inject('appstreamImagesStore')(withRouter(observer(AppstreamImageCard)));
