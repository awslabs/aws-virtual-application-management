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

import { observer } from 'mobx-react';
import { observable, runInAction } from 'mobx';
import React, { Component } from 'react';
import { Button, Segment } from 'semantic-ui-react';
import i18n from 'roddeh-i18n';
import SimpleTable from '@aws-ee/base-ui/dist/parts/helpers/SimpleTable';
import ConfirmationModal from '@aws-ee/base-ui/dist/parts/helpers/ConfirmationModal';
import DetailsPageSection from '@aws-ee/base-ui/dist/parts/helpers/DetailsPageSection';
import { displaySuccess, displayError } from '@aws-ee/base-ui/dist/helpers/notification';
import _ from 'lodash';
import keys from '../../../../vam-ui-i18n/dist';
import GrantGroupAccessModal from './GrantGroupAccessModal';

// expected props
// - model
class GroupAccessSection extends Component {
  constructor() {
    super();
    this.componentStore = observable({
      revokeGroup: null,
      openShareModal: false,
      openRevokeShareModal: false,
      revokeGroupProcessing: false,
    });
  }

  render() {
    const model = this.props.model;
    return (
      <>
        {this.renderAccessSection(model)}
        {this.renderModals(model)}
      </>
    );
  }

  renderAccessSection(model) {
    return (
      <DetailsPageSection
        title={i18n(keys.ACCESS)}
        actions={[
          {
            label: i18n(keys.GRANT_ACCESS),
            action: () => {
              runInAction(() => {
                this.componentStore.openShareModal = true;
              });
            },
          },
        ]}
        content={
          model.sharedGroups.length === 0 ? (
            <Segment secondary textAlign="center">
              {i18n(keys.NOT_SHARED_ANYONE)}
            </Segment>
          ) : (
            <SimpleTable
              rowData={model.sharedGroups}
              headerRenderer={() => {
                return [i18n(keys.ID), i18n(keys.NAME), ''];
              }}
              rowRenderer={group => {
                return [
                  group.id,
                  group.name,
                  <Button
                    size="mini"
                    basic
                    color="blue"
                    floated="right"
                    onClick={() => {
                      runInAction(() => {
                        this.componentStore.revokeGroup = group;
                        this.componentStore.openRevokeShareModal = true;
                      });
                    }}
                  >
                    {i18n(keys.REVOKE_ACCESS)}
                  </Button>,
                ];
              }}
            />
          )
        }
      />
    );
  }

  renderModals(model) {
    return (
      <>
        <ConfirmationModal
          open={this.componentStore.openRevokeShareModal}
          processing={this.componentStore.revokeGroupProcessing}
          header={i18n(keys.REVOKE_ACCESS)}
          confirmLabel={i18n(keys.REVOKE_ACCESS)}
          message={i18n(keys.REVOKE_GROUP_ACCESS_CONFIRMATION, {
            group: this.componentStore.revokeGroup ? _.escape(this.componentStore.revokeGroup.name) : '',
          })}
          onConfirm={() => {
            runInAction(() => {
              this.componentStore.revokeGroupProcessing = true;
            });
            this.revokeGroup();
          }}
          onCancel={() => {
            runInAction(() => {
              this.componentStore.revokeGroupProcessing = false;
            });
            this.closeModals();
          }}
        />
        <GrantGroupAccessModal
          target={model}
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
      this.componentStore.revokeGroupProcessing = false;
      this.componentStore.revokeGroup = null;
    });
  }

  async revokeGroup() {
    try {
      const group = this.componentStore.revokeGroup;
      const model = this.props.model;
      await model.revokeGroupAccess(group.id);
      displaySuccess(i18n(keys.REVOKE_GROUP_SUCCESS, { groupId: _.escape(group.id) }), i18n(keys.REVOKED));
      this.closeModals();
    } catch (error) {
      displayError(error);
      this.closeModals();
    }
  }
}

export default observer(GroupAccessSection);
