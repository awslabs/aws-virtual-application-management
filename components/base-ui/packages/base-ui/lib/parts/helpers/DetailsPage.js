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
import { Breadcrumb, Container, Header, Segment } from 'semantic-ui-react';

import { gotoFn } from '../../helpers/routing';
import { swallowError } from '../../helpers/utils';
import { isStoreError, isStoreLoading, isStoreReady } from '../../models/BaseStore';
import BasicProgressPlaceholder from './BasicProgressPlaceholder';
import ErrorBox from './ErrorBox';
import DetailsPageSection from './DetailsPageSection';

class DetailsPage extends Component {
  constructor() {
    super();
    this.goto = gotoFn(this);
  }

  componentDidMount() {
    const store = this.getStore();
    swallowError(store.load());
  }

  render() {
    const store = this.getStore();
    let content = null;
    if (isStoreError(store)) {
      content = <ErrorBox error={store.error} />;
    } else if (isStoreLoading(store)) {
      content = <BasicProgressPlaceholder segmentCount={3} />;
    } else if (isStoreReady(store)) {
      content = this.renderMain();
    } else {
      content = null;
    }
    return (
      <Container className="mt3">
        <div className="mb4">{content}</div>
      </Container>
    );
  }

  renderMain() {
    const model = this.getModel();
    if (!model) {
      return <ErrorBox error={`The ${this.getModelName()} "${this.getModelId()}" does not exist`} />;
    }
    return (
      <div>
        {this.renderBreadcrumbs(model)}
        <Segment>
          <div className="ml2">
            <div className="flex-auto">
              <div className="flex">
                {this.renderTitle(model)}
                <div className="ml-auto">{this.renderActionButtons(model)}</div>
              </div>
            </div>
            {this.renderDetails(model)}
          </div>
        </Segment>
      </div>
    );
  }

  renderBreadcrumbs(model) {
    return (
      <Breadcrumb>
        <Breadcrumb.Section link onClick={() => this.goto(this.getListPageLink())}>
          {this.getModelName()}
        </Breadcrumb.Section>
        <Breadcrumb.Divider icon="right angle" />
        <Breadcrumb.Section active>{model.id}</Breadcrumb.Section>
      </Breadcrumb>
    );
  }

  renderTitle(model) {
    return (
      <Header as="h1" color="grey" className="mt3">
        {model.title}
      </Header>
    );
  }

  renderActionButtons(_model) {
    return null;
  }

  renderSection({ title, content, actions }) {
    return <DetailsPageSection title={title} content={content} actions={actions} />;
  }

  renderDetails(model) {
    return model.description;
  }

  getStore() {
    throw new Error('This needs to be implemented in child classes');
  }

  getModelId() {
    return decodeURIComponent((this.props.match.params || {}).modelId);
  }

  getModel() {
    return this.getStore().getById(this.getModelId());
  }

  getModelName() {
    return 'Model Name';
  }
}

export default DetailsPage;
