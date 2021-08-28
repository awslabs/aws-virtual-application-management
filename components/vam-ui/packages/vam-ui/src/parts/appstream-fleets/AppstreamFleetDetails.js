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
import { runInAction, observable } from 'mobx';
import React from 'react';
import { Header, Image } from 'semantic-ui-react';
import i18n from 'roddeh-i18n';
import DetailsPage from '@aws-ee/base-ui/dist/parts/helpers/DetailsPage';
import SimpleTable from '@aws-ee/base-ui/dist/parts/helpers/SimpleTable';
import Stores from '@aws-ee/base-ui/dist/models/Stores';
import keys from '../../../../vam-ui-i18n/dist';
import AppstreamFleetActions from './AppstreamFleetActions';
import GroupAccessSection from '../shared/GroupAccessSection';
import SwapImageModal from './SwapImageModal';

// expected props
// - modelId (via react router params)
// - appstreamFleetsStore (via injection)
// - appstreamImagesStore (via injection)
class AppstreamFleetDetails extends DetailsPage {
  constructor(props) {
    super(props);
    runInAction(() => {
      this.store = new Stores([props.appstreamFleetsStore, props.appstreamImagesStore]);
    });
    this.componentStore = observable({
      openSwapModal: null,
    });
  }

  renderDetails(model) {
    return (
      <>
        {this.renderSummary(model)}
        {this.renderCapacity(model)}
        {this.renderImageDetails(model)}
        <GroupAccessSection model={model} />
        {this.renderModals(model)}
      </>
    );
  }

  renderSummary(model) {
    return (
      <SimpleTable
        rowData={[
          [i18n(keys.CREATED), model.created],
          [i18n(keys.STATUS), model.statusLabel],
          [i18n(keys.INSTANCE_TYPE), model.instanceType],
          [i18n(keys.FLEET_TYPE), model.fleetTypeLabel],
          [i18n(keys.MAX_USER_DURATION), Math.round(model.maxUserDurationInSeconds / 60)],
          [i18n(keys.DISCONNECT_TIME), Math.round(model.disconnectTimeoutInSeconds / 60)],
          [i18n(keys.IDLE_DISCONNECT_TIMEOUT), Math.round(model.idleDisconnectTimeoutInSeconds / 60)],
        ]}
      />
    );
  }

  renderActionButtons(model) {
    return <AppstreamFleetActions appstreamFleet={model} />;
  }

  renderCapacity(model) {
    const cap = model.computeCapacityStatus;

    return this.renderSection({
      title: i18n(keys.CAPACITY),
      content: (
        <SimpleTable
          headerRenderer={() => {
            return [i18n(keys.DESIRED), i18n(keys.RUNNING), i18n(keys.IN_USE), i18n(keys.AVAILABLE)];
          }}
          rowData={[[cap.desired, cap.running, cap.inUse, cap.available]]}
        />
      ),
    });
  }

  renderImageDetails() {
    const image = this.getImage();
    if (!image) {
      return null;
    }

    return this.renderSection({
      title: `${i18n(keys.APPSTREAM_IMAGE)} - ${image.name}`,
      actions: [
        {
          label: i18n(keys.IMAGE_DETAILS),
          action: () => {
            this.goto(`/appstream-images/details/${encodeURIComponent(image.id)}`);
          },
        },
        {
          label: i18n(keys.SWAP_IMAGE),
          action: () => {
            runInAction(() => {
              this.componentStore.openSwapModal = true;
            });
          },
        },
      ],
      content: (
        <>
          <SimpleTable
            rowData={[
              [i18n(keys.PLATFORM), image.platform],
              [i18n(keys.CREATED), image.created],
            ]}
          />
          <Header as="h4">{i18n(keys.APPLICATIONS)}</Header>
          <SimpleTable
            rowData={image.applications}
            headerRenderer={() => {
              return [i18n(keys.ICON), i18n(keys.ID), i18n(keys.NAME)];
            }}
            rowRenderer={row => {
              return [<Image src={row.iconUrl} width="20" height="20" />, row.id, row.displayName];
            }}
          />
        </>
      ),
    });
  }

  renderModals(model) {
    return (
      <SwapImageModal
        appstreamFleet={model}
        open={this.componentStore.openSwapModal}
        onSuccess={() => {
          this.closeModals();
        }}
        onCancel={() => {
          this.closeModals();
        }}
      />
    );
  }

  closeModals() {
    runInAction(() => {
      this.componentStore.openSwapModal = false;
    });
  }

  getStore() {
    return this.store;
  }

  getModel() {
    return this.props.appstreamFleetsStore.getById(this.getModelId());
  }

  getImage() {
    const fleet = this.getModel();
    return this.props.appstreamImagesStore.getById(fleet.imageName);
  }

  getModelName() {
    return i18n(keys.APPSTREAM_FLEETS);
  }

  getListPageLink() {
    return '/appstream-fleets';
  }
}

export default inject('appstreamFleetsStore', 'appstreamImagesStore')(observer(AppstreamFleetDetails));
