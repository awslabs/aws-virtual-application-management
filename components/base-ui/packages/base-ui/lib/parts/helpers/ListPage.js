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

import React, { Component } from 'react';
import _ from 'lodash';
import { Container, Label, Header, Segment, Button, Icon } from 'semantic-ui-react';
import { gotoFn } from '../../helpers/routing';

import { swallowError } from '../../helpers/utils';
import { isStoreError, isStoreLoading, isStoreReady, isStoreNotEmpty, isStoreEmpty } from '../../models/BaseStore';
import BasicProgressPlaceholder from './BasicProgressPlaceholder';
import ErrorBox from './ErrorBox';
import DocumentationClient from '../documentation-client/DocumentationClient';

class ListPage extends Component {
  componentDidMount() {
    const store = this.getStore();
    swallowError(store.load());
    store.startHeartbeat();
    this.goto = gotoFn(this);
  }

  componentWillUnmount() {
    const store = this.getStore();
    store.stopHeartbeat();
  }

  getStore() {
    throw new Error('getStore must be overridden by child components');
  }

  getDocumentationUrl() {
    throw new Error('getDocumentationUrl must be overridden by child components');
  }

  render() {
    const store = this.getStore();
    let content = null;

    if (isStoreError(store)) {
      content = <ErrorBox error={store.error} />;
    } else if (isStoreLoading(store)) {
      content = <BasicProgressPlaceholder segmentCount={3} />;
    } else if (isStoreEmpty(store)) {
      content = this.renderEmpty();
    } else if (isStoreReady(store)) {
      content = this.renderMain();
    } else {
      content = null;
    }

    return (
      <Container className="mt3">
        <DocumentationClient urlSuffix={this.getDocumentationUrl()} />
        <div className="mb4">{content}</div>
      </Container>
    );
  }

  renderCount() {
    const store = this.getStore();
    const showCount = isStoreReady(store) && isStoreNotEmpty(store);
    const list = store.list;
    return (
      showCount && (
        <Label circular size="medium">
          {list.length}
        </Label>
      )
    );
  }

  getIconType() {
    return 'file';
  }

  renderTitleText() {
    return 'Title';
  }

  renderHeaderButtons() {
    return null;
  }

  renderTitle() {
    return (
      <div className="mb3 flex">
        <Header as="h3" className="color-grey mt1 mb0 flex-auto">
          <Icon name={this.getIconType()} className="align-top" />
          <Header.Content className="left-align">
            {this.renderTitleText()}
            {this.renderCount()}
          </Header.Content>
        </Header>
        {this.renderHeaderButtons()}
      </div>
    );
  }

  renderNavButton(text, link, attributes) {
    return (
      <Button
        color="blue"
        size="medium"
        basic
        onClick={() => {
          this.goto(link);
        }}
        {...attributes}
      >
        {text}
      </Button>
    );
  }

  renderMain() {
    const list = this.getStore().list;
    return (
      <>
        {this.renderTitle()}
        <div>
          {_.map(list, (model, index) => (
            <Segment clearing key={model.id} className="mb2">
              {this.renderListItem(model, index)}
            </Segment>
          ))}
        </div>
      </>
    );
  }

  renderEmpty() {
    return (
      <Container text className="mt4 center">
        <Header as="h2" icon textAlign="center" className="mt3" color="grey">
          <Icon name={this.getIconType()} circular />
          <div className="mt3 ml3 mr3 animated fadeIn">{this.renderEmptyText()}</div>
          <div className="mt3 ml3 mr3 animated fadeIn">{this.renderEmptyButtons()}</div>
        </Header>
      </Container>
    );
  }

  renderEmptyText() {
    return '';
  }

  renderEmptyButtons() {
    return this.renderHeaderButtons();
  }

  renderListItem(model, index) {
    return (
      <>
        {index} - {model.id}
      </>
    );
  }
}

export default ListPage;
