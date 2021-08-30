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
import React from 'react';
import { Button, Segment } from 'semantic-ui-react';
import i18n from 'roddeh-i18n';
import DetailsPage from '@aws-ee/base-ui/dist/parts/helpers/DetailsPage';
import SimpleTable from '@aws-ee/base-ui/dist/parts/helpers/SimpleTable';
import ConfirmationModal from '@aws-ee/base-ui/dist/parts/helpers/ConfirmationModal';
import { displaySuccess, displayError } from '@aws-ee/base-ui/dist/helpers/notification';
import keys from '../../../../vam-ui-i18n/dist';
import ShareImageModal from './ShareImageModal';
import ApplicationsSection from '../shared/ApplicationsSection';

// expected props
// - modelId (via react router params)
// - appstreamImagesStore (via injection)
class AppstreamImageDetails extends DetailsPage {
  constructor() {
    super();
    this.componentStore = observable({
      revokeAccountId: null,
      openRevokeShareModal: false,
      revokeAccountProcessing: false,
    });
  }

  renderActionButtons(_model) {
    return (
      <>
        <Button.Group basic size="mini">
          <Button onClick={() => this.cloneImage()}>{i18n(keys.CLONE_IMAGE)}</Button>
        </Button.Group>
      </>
    );
  }

  renderDetails(model) {
    return (
      <>
        {this.renderSummary(model)}
        <ApplicationsSection applications={model.applications} />
        {this.renderSharingSection(model)}
        {this.renderModals()}
      </>
    );
  }

  renderSummary(model) {
    return (
      <SimpleTable
        rowData={[
          [i18n(keys.PLATFORM), model.platform],
          [i18n(keys.CREATED), model.created],
          [i18n(keys.DYNAMIC_APPLICATION_CATALOGS_ENABLED), i18n(model.dapEnabled ? keys.YES : keys.NO)],
        ]}
      />
    );
  }

  renderSharingSection(model) {
    return this.renderSection({
      title: i18n(keys.SHARING),
      actions: [
        {
          label: i18n(keys.SHARE_IMAGE),
          action: () => {
            runInAction(() => {
              this.componentStore.openShareModal = true;
            });
          },
        },
      ],
      content:
        model.sharedAccounts.length === 0 ? (
          <Segment secondary textAlign="center">
            {i18n(keys.NOT_SHARED)}
          </Segment>
        ) : (
          <SimpleTable
            rowData={model.sharedAccounts}
            headerRenderer={() => {
              return [i18n(keys.ACCOUNT_ID), i18n(keys.NAME), ''];
            }}
            rowRenderer={accountId => {
              return [
                accountId,
                <Button
                  size="mini"
                  basic
                  color="blue"
                  floated="right"
                  onClick={() => {
                    runInAction(() => {
                      this.componentStore.revokeAccountId = accountId;
                      this.componentStore.openRevokeShareModal = true;
                    });
                  }}
                >
                  {i18n(keys.REVOKE_ACCESS)}
                </Button>,
              ];
            }}
          />
        ),
    });
  }

  renderModals() {
    return (
      <>
        <ConfirmationModal
          open={this.componentStore.openRevokeShareModal}
          processing={this.componentStore.revokeAccountProcessing}
          header={i18n(keys.REVOKE_ACCESS)}
          confirmLabel={i18n(keys.REVOKE_ACCESS)}
          message={i18n(keys.REVOKE_ACCESS_CONFIRMATION, {
            account: this.componentStore.revokeAccountId ? this.componentStore.revokeAccountId : '',
          })}
          onConfirm={() => {
            runInAction(() => {
              this.componentStore.revokeAccountProcessing = true;
            });
            this.revokeAccount();
          }}
          onCancel={() => {
            runInAction(() => {
              this.componentStore.openRevokeShareModal = false;
            });
          }}
        />
        <ShareImageModal
          appstreamImage={this.getModel()}
          open={this.componentStore.openShareModal}
          onSuccess={() => {
            this.closeModals();
          }}
          onCancel={() => {
            this.closeModals();
          }}
        />
      </>
    );
  }

  closeModals() {
    runInAction(() => {
      this.componentStore.openShareModal = false;
      this.componentStore.openRevokeShareModal = false;
      this.componentStore.revokeAccountProcessing = false;
    });
  }

  getStore() {
    return this.props.appstreamImagesStore;
  }

  getModelName() {
    return i18n(keys.APPSTREAM_IMAGES);
  }

  getListPageLink() {
    return '/appstream-images';
  }

  cloneImage() {
    const model = this.getModel();
    this.goto(`/appstream-images/create/${model.id}`);
  }

  async revokeAccount() {
    try {
      const accntId = this.componentStore.revokeAccountId;
      const model = this.getModel();
      await model.revokeSharingWithAwsAccount(accntId);
      displaySuccess(i18n(keys.REVOKE_SUCCESS, { accountId: accntId }), i18n(keys.REVOKED));
      this.closeModals();
    } catch (error) {
      displayError(error);
      this.closeModals();
    }
  }
}

export default inject('appstreamImagesStore')(observer(AppstreamImageDetails));
