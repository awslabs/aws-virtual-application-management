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
import { Button, Header, Icon, Modal, TextArea } from 'semantic-ui-react';
import { observer } from 'mobx-react';
import i18n from 'roddeh-i18n';
import { displaySuccess } from '@aws-ee/base-ui/dist/helpers/notification';
import baseKeys from '@aws-ee/base-ui-i18n';
import keys from '../../../../vam-ui-i18n/dist';

class TestLinkModal extends React.Component {
  render() {
    const processing = this.props.processing;
    return (
      <Modal open={this.props.open} size="tiny" onClose={this.props.onCancel} closeOnDimmerClick={!processing}>
        <Header content={i18n(keys.TEST_FLEET)} />
        <Modal.Content>
          <TextArea
            style={{ minHeight: 100, width: '100%' }}
            value={this.props.link}
            data-testid="test-link-textarea"
          />
        </Modal.Content>
        <Modal.Actions>
          <Button
            disabled={processing}
            onClick={() => {
              if (this.props.onCancel && typeof this.props.onCancel === 'function') {
                this.props.onCancel();
              }
            }}
            data-testid="test-fleet-done-button"
          >
            {i18n(baseKeys.DONE)}
          </Button>
          <Button
            loading={processing}
            color="blue"
            onClick={() => this.handleCopy()}
            data-testid="test-fleet-copy-button"
          >
            <Icon name="copy outline" /> {i18n(keys.COPY_LINK)}
          </Button>
        </Modal.Actions>
      </Modal>
    );
  }

  async handleCopy() {
    navigator.clipboard.writeText(this.props.link);
    displaySuccess(i18n(keys.LINK_COPIED));
  }
}

export default observer(TestLinkModal);
