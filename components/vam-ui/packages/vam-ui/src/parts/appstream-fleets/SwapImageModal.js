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
import { Button, Header, Modal, Dropdown } from 'semantic-ui-react';
import { observer, inject } from 'mobx-react';
import { observable, runInAction } from 'mobx';
import { displayError, displaySuccess } from '@aws-ee/base-ui/dist/helpers/notification';
import i18n from 'roddeh-i18n';
import { swallowError } from '@aws-ee/base-ui/dist/helpers/utils';
import { isStoreReady } from '@aws-ee/base-ui/dist/models/BaseStore';
import baseKeys from '@aws-ee/base-ui-i18n';
import keys from '../../../../vam-ui-i18n/dist';

class SwapImageModal extends React.Component {
  constructor() {
    super();
    this.componentStore = observable({
      value: null,
      processing: false,
    });
  }

  componentDidMount() {
    const store = this.props.appstreamImagesStore;
    swallowError(store.load());
  }

  render() {
    const store = this.props.appstreamImagesStore;
    const processing = this.componentStore.processing || !isStoreReady(store);
    const disableShareButton = processing || this.componentStore.value === null;

    const options = store.dropdownOptions.filter(o => {
      // Filter out the image that is currently set.
      return o.value !== this.props.appstreamFleet.imageName;
    });

    return (
      <Modal open={this.props.open} size="tiny" onClose={this.props.onCancel} closeOnDimmerClick={!processing}>
        <Header content={i18n(keys.SWAP_IMAGE)} />
        <Modal.Content>
          <Dropdown
            disabled={processing}
            fluid
            selection
            options={options}
            onChange={(e, { value }) => {
              runInAction(() => {
                this.componentStore.value = value;
              });
            }}
          />
        </Modal.Content>
        <Modal.Actions>
          <Button
            disabled={processing}
            onClick={() => {
              this.reset();
              this.props.onCancel();
            }}
          >
            {i18n(baseKeys.CANCEL)}
          </Button>
          <Button loading={processing} disabled={disableShareButton} color="blue" onClick={() => this.handleSwap()}>
            {i18n(keys.SWAP_IMAGE)}
          </Button>
        </Modal.Actions>
      </Modal>
    );
  }

  reset() {
    runInAction(() => {
      this.componentStore.value = null;
      this.componentStore.processing = false;
    });
  }

  async handleSwap() {
    runInAction(() => {
      this.componentStore.processing = true;
    });
    const value = this.componentStore.value;
    try {
      const store = this.props.appstreamImagesStore;
      const imageName = store.getById(value).name;
      await this.props.appstreamFleet.swapImage(imageName);
      displaySuccess(i18n(keys.SWAP_SUCCESS), i18n(keys.SWAPPED));
      this.reset();
      if (this.props.onSuccess && typeof this.props.onSuccess === 'function') {
        this.props.onSuccess();
      }
    } catch (error) {
      displayError(error);
      runInAction(() => {
        this.componentStore.processing = false;
      });
    }
  }
}

export default inject('appstreamImagesStore')(observer(SwapImageModal));
