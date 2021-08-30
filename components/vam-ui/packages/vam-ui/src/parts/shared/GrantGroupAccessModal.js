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

class GrantGroupAccessModal extends React.Component {
  constructor() {
    super();
    this.componentStore = observable({
      value: null,
      processing: false,
    });
  }

  componentDidMount() {
    const store = this.props.groupsStore;
    swallowError(store.load());
  }

  render() {
    const store = this.props.groupsStore;
    const processing = this.componentStore.processing || !isStoreReady(store);
    const disableShareButton = processing || this.componentStore.value === null;

    return (
      <Modal open={this.props.open} size="tiny" onClose={this.props.onCancel} closeOnDimmerClick={!processing}>
        <Header content={i18n(keys.GRANT_ACCESS)} />
        <Modal.Content>
          <Dropdown
            disabled={processing}
            fluid
            search
            selection
            options={store.dropdownOptions}
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
          <Button loading={processing} disabled={disableShareButton} color="blue" onClick={() => this.handleShare()}>
            {i18n(keys.GRANT_ACCESS)}
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

  async handleShare() {
    runInAction(() => {
      this.componentStore.processing = true;
    });
    const groupId = this.componentStore.value;
    try {
      const groupName = this.props.groupsStore.getById(groupId).name;
      await this.props.target.grantGroupAccess(groupId, groupName);
      displaySuccess(i18n(keys.ACCESS_WAS_GRANTED), i18n(keys.ACCESS_GRANTED));
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

export default inject('groupsStore')(observer(GrantGroupAccessModal));
