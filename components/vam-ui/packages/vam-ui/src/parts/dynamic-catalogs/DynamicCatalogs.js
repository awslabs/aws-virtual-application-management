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
import { observable, runInAction } from 'mobx';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import i18n from 'roddeh-i18n';
import { Button } from 'semantic-ui-react';
import ListPage from '@aws-ee/base-ui/dist/parts/helpers/ListPage';
import SimpleTable from '@aws-ee/base-ui/dist/parts/helpers/SimpleTable';
import ConfirmationModal from '@aws-ee/base-ui/dist/parts/helpers/ConfirmationModal';
import keys from '../../../../vam-ui-i18n/dist';

class DynamicCatalogs extends ListPage {
  constructor(props) {
    super(props);
    this.componentStore = observable({
      catalogToDelete: null,
      deleteCatalogProcessing: false,
    });
  }

  componentDidMount() {
    this.props.dynamicCatalogsStore.load();
    this.props.groupsStore.load();
    super.componentDidMount();
  }

  getStore() {
    return this.props.dynamicCatalogsStore;
  }

  getDocumentationUrl() {
    return 'user_guide/sidebar/common/dynamic-catalogs/introduction';
  }

  getGroupStore() {
    return this.props.groupsStore;
  }

  getIconType() {
    return 'search plus';
  }

  renderHeaderButtons() {
    return this.renderNavButton(i18n(keys.CREATE_DYNAMIC_CATALOG), '/dynamic-catalogs/create', {
      'data-testid': 'create-dyncat-button',
    });
  }

  renderTitleText() {
    return i18n(keys.DYNAMIC_CATALOGS);
  }

  renderMain() {
    const list = this.getStore().list;

    return (
      <>
        {this.renderTitle()}
        <SimpleTable
          data-testid="dynamic-catalogs"
          rowData={list}
          headerRenderer={() => {
            return [i18n(keys.ID), i18n(keys.APPSTREAM_FLEET), i18n(keys.APPLICATIONS), ''];
          }}
          rowRenderer={row => {
            return [
              row.id,
              row.fleet,
              row.applications.map(a => a.displayName).join(', '),
              <>
                <Button
                  onClick={event => {
                    this.handleDetails(event, row);
                  }}
                  basic
                  size="mini"
                >
                  {i18n(keys.DETAILS)}
                </Button>
                <Button
                  onClick={_event => {
                    this.handleTestDynamicCatalog(row);
                  }}
                  basic
                  size="mini"
                >
                  {i18n(keys.TEST_CATALOG)}
                </Button>
                <Button
                  onClick={_event => {
                    this.handleDeleteDynamicCatalog(row);
                  }}
                  basic
                  size="mini"
                  data-testid="delete-button"
                >
                  {i18n(keys.DELETE_CATALOG)}
                </Button>
              </>,
            ];
          }}
        />
        <ConfirmationModal
          open={this.componentStore.catalogToDelete !== null}
          processing={this.componentStore.deleteCatalogProcessing}
          header={i18n(keys.DELETE_CATALOG)}
          confirmLabel={i18n(keys.DELETE_CATALOG)}
          message={i18n(keys.DELETE_CATALOG_CONFIRMATION, {
            dynamicCatalog: (this.componentStore.catalogToDelete || {}).id || '',
          })}
          onConfirm={() => {
            runInAction(() => {
              this.componentStore.deleteCatalogProcessing = true;
            });
            this.deleteCatalog();
          }}
          onCancel={() => {
            this.closeModals();
          }}
        />
      </>
    );
  }

  handleDetails(event, model) {
    this.handleNavigate(event, `/dynamic-catalogs/details/${encodeURIComponent(model.id)}`);
  }

  handleNavigate(event, link) {
    event.preventDefault();
    event.stopPropagation();
    this.goto(link);
  }

  async handleDeleteDynamicCatalog(model) {
    runInAction(() => {
      this.componentStore.catalogToDelete = model;
    });
  }

  closeModals() {
    runInAction(() => {
      this.componentStore.catalogToDelete = null;
      this.componentStore.deleteCatalogProcessing = false;
    });
  }

  async deleteCatalog() {
    runInAction(() => {
      this.componentStore.deleteCatalogProcessing = true;
    });
    await this.getStore().deleteDynamicCatalog(this.componentStore.catalogToDelete.id);
    this.closeModals();
  }

  renderEmptyText() {
    return i18n(keys.EMPTY_DYNAMIC_CATALOGS);
  }
}

export default inject('dynamicCatalogsStore', 'groupsStore')(withRouter(observer(DynamicCatalogs)));
