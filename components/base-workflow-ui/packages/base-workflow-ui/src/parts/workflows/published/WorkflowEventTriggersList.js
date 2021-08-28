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

import _ from 'lodash';
import React from 'react';
import { observer, inject } from 'mobx-react';
import { decorate, action, observable, runInAction } from 'mobx';
import { withRouter } from 'react-router-dom';
import TimeAgo from 'react-timeago';
import JSONTreeComponent from 'react-json-tree';
import { Header, Segment, Icon, Table, Button } from 'semantic-ui-react';
import { swallowError } from '@aws-ee/base-ui/dist/helpers/utils';
import { isStoreError, isStoreReady, isStoreLoading, isStoreEmpty } from '@aws-ee/base-ui/dist/models/BaseStore';
import { displayError, displaySuccess } from '@aws-ee/base-ui/dist/helpers/notification';
import ErrorBox from '@aws-ee/base-ui/dist/parts/helpers/ErrorBox';

import CreateWorkflowEventTriggerWizard from './CreateWorkflowEventTrigger';
import ProgressPlaceHolder from '../../workflow-common/ProgressPlaceholder';

// expected props
// - workflowVersion (via props)
// - workflowsStore (via injection)
// - userDisplayName (via injection)
// - location (from react router)
class WorkflowEventTriggersList extends React.Component {
  componentDidMount() {
    const store = this.getEventTriggersStore();
    swallowError(store.load());
    store.startHeartbeat();
    runInAction(() => {
      this.showCreateEventTriggerWizard = false;
      this.processing = false;
    });
  }

  componentWillUnmount() {
    const store = this.getEventTriggersStore();
    store.stopHeartbeat();
  }

  getWorkflowVersion() {
    return this.props.workflowVersion;
  }

  getWorkflowStore() {
    const version = this.getWorkflowVersion();
    return this.props.workflowsStore.getWorkflowStore(version.id);
  }

  getEventTriggersStore() {
    const workflowStore = this.getWorkflowStore();
    return workflowStore.getEventTriggersStore();
  }

  isEventTriggersStoreEmpty() {
    const workflowStore = this.getWorkflowStore();
    const eventTriggersStore = workflowStore.getEventTriggersStore();

    if (isStoreEmpty(eventTriggersStore)) {
      return true;
    }

    const currentWorkflowVersion = this.getWorkflowVersion();

    // If there are no triggers for the current workflow version, we treat the store as empty in this view
    if (!_.find(eventTriggersStore.list, { workflowVer: currentWorkflowVersion.v })) {
      return true;
    }

    return false;
  }

  getUserDisplayName() {
    return this.props.userDisplayName;
  }

  handleCreateEventTriggerClick() {
    this.showCreateEventTriggerWizard = true;
  }

  handleCreateEventTriggerCancel() {
    this.showCreateEventTriggerWizard = false;
  }

  async handleDeleteEventTriggerClick(id) {
    this.processing = true;
    try {
      await this.getEventTriggersStore().delete(id);
    } catch (error) {
      displayError(error);
    }

    displaySuccess(`Successfully deleted workflow event trigger: ${id}`);
    // Even though handleDeleteEventTriggerClick is declared as an action in the decorator,
    // this will still error in the console if we don't wrap it in an action
    runInAction(() => {
      this.processing = false;
    });
  }

  render() {
    const store = this.getEventTriggersStore();
    let content = null;

    if (isStoreError(store)) {
      content = <ErrorBox error={store.error} className="p0" />;
    } else if (isStoreLoading(store)) {
      content = <ProgressPlaceHolder />;
    } else if (isStoreReady(store)) {
      content = this.renderMain();
    } else {
      // We get here if the store is in the initial state
      content = null;
    }

    return <>{content}</>;
  }

  renderMain() {
    const disabled = this.showCreateEventTriggerWizard;
    const isEmpty = this.isEventTriggersStoreEmpty();

    return (
      <>
        <div className="clearfix mb2">
          <Button
            basic
            color="blue"
            disabled={disabled}
            floated="right"
            onClick={() => this.handleCreateEventTriggerClick()}
          >
            Create Event Trigger
          </Button>
        </div>
        {isEmpty ? this.renderEmptyEventTriggers() : this.renderEventTriggers()}
        {this.renderWizard()}
      </>
    );
  }

  renderEventTriggers() {
    const store = this.getEventTriggersStore();
    const eventTriggers = store.list;

    return <Segment padded>{this.renderEventTriggersTable(eventTriggers)}</Segment>;
  }

  renderEventTriggersTable(eventTriggers) {
    return (
      <Table basic="very" className="animated">
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Id</Table.HeaderCell>
            <Table.HeaderCell>Created</Table.HeaderCell>
            <Table.HeaderCell>Event Pattern</Table.HeaderCell>
            <Table.HeaderCell>Actions</Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>{_.map(eventTriggers, eventTrigger => this.renderEventTriggerRow(eventTrigger))}</Table.Body>
      </Table>
    );
  }

  renderEventTriggerRow(eventTrigger) {
    const { id, createdAt, createdBy, eventPattern, workflowVer } = eventTrigger;

    // This particular event trigger is not tied to the current workflow version that we're looking at so we return early
    const currentWorkflowVersion = this.getWorkflowVersion();

    if (workflowVer !== currentWorkflowVersion.v) {
      return undefined;
    }

    const userDisplayName = this.getUserDisplayName();
    const isSystem = userDisplayName.isSystem({ uid: createdBy });
    const by = () => (isSystem ? '' : <span>by {userDisplayName.getDisplayName({ uid: createdBy })}</span>);

    const theme = {
      scheme: 'default',
      base00: '#181818',
      base01: '#282828',
      base02: '#383838',
      base03: '#585858',
      base04: '#b8b8b8',
      base05: '#d8d8d8',
      base06: '#e8e8e8',
      base07: '#f8f8f8',
      base08: '#ab4642',
      base09: '#dc9656',
      base0A: '#f7ca88',
      base0B: '#a1b56c',
      base0C: '#86c1b9',
      base0D: '#7cafc2',
      base0E: '#ba8baf',
      base0F: '#a16946',
    };
    const invertTheme = true;

    return (
      <Table.Row key={id}>
        <Table.Cell>{id}</Table.Cell>
        <Table.Cell>
          <TimeAgo date={createdAt} />
          <div>{by()}&nbsp;</div>
        </Table.Cell>
        <Table.Cell>
          <JSONTreeComponent data={JSON.parse(eventPattern)} theme={theme} invertTheme={invertTheme} hideRoot />
        </Table.Cell>
        <Table.Cell>
          <Button
            disabled={this.processing}
            loading={this.processing}
            onClick={() => {
              this.handleDeleteEventTriggerClick(id);
            }}
          >
            Delete
          </Button>
        </Table.Cell>
      </Table.Row>
    );
  }

  renderEmptyEventTriggers() {
    const show = this.showCreateEventTriggerWizard;
    if (show) return null;

    return (
      <Segment placeholder>
        <Header icon className="color-grey">
          <Icon name="chain" />
          No event triggers
          <Header.Subheader>
            Event triggers allow you to configure the workflow to be triggered based on different criteria, try it out!
          </Header.Subheader>
        </Header>
      </Segment>
    );
  }

  renderWizard() {
    const show = this.showCreateEventTriggerWizard;
    if (!show) return null;
    return (
      <CreateWorkflowEventTriggerWizard
        onCancel={() => this.handleCreateEventTriggerCancel()}
        workflowVersion={this.getWorkflowVersion()}
      />
    );
  }
}

// see https://medium.com/@mweststrate/mobx-4-better-simpler-faster-smaller-c1fbc08008da
decorate(WorkflowEventTriggersList, {
  handleCreateEventTriggerClick: action,
  handleCreateEventTriggerCancel: action,
  handleDeleteEventTriggerClick: action,
  showCreateEventTriggerWizard: observable,
  processing: observable,
});

export default inject('workflowsStore', 'userDisplayName')(withRouter(observer(WorkflowEventTriggersList)));
