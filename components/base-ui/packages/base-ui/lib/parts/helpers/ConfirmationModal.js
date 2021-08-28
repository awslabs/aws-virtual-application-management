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
import { Button, Header, Modal } from 'semantic-ui-react';

// expected props
// - open, whether the dialog should be visible or not.
// - onConfirm, handler method for the confirm case.
// - onCancel, handler method for the cancel case.
// - header (default to empty string)
// - message (default to empty string)
// - confirmLabel (default to 'Confirm')
// - cancelLabel (default to 'Cancel')
const ConfirmationModal = ({
  open,
  processing = false,
  header = '',
  message = '',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onCancel,
  onConfirm,
}) => {
  return (
    <Modal open={open} size="tiny" onClose={onCancel} closeOnDimmerClick data-testid="confirmation-modal">
      <Header content={header} />
      <Modal.Content>{message}</Modal.Content>
      <Modal.Actions>
        <Button onClick={onCancel} disabled={processing} data-testid="cancel-button">
          {cancelLabel}
        </Button>
        <Button color="blue" onClick={onConfirm} loading={processing} data-testid="confirm-button">
          {confirmLabel}
        </Button>
      </Modal.Actions>
    </Modal>
  );
};

export default ConfirmationModal;
