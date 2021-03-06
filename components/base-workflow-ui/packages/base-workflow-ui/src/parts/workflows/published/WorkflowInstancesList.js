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
import { decorate, action, autorun, runInAction, observable } from 'mobx';
import { withRouter } from 'react-router-dom';
import TimeAgo from 'react-timeago';
import { Header, Segment, Icon, Statistic, Grid, Label, Button, Tab } from 'semantic-ui-react';
import { gotoFn } from '@aws-ee/base-ui/dist/helpers/routing';
import { displayError } from '@aws-ee/base-ui/dist/helpers/notification';
import { swallowError, niceNumber } from '@aws-ee/base-ui/dist/helpers/utils';
import { isStoreError, isStoreReady, isStoreLoading, isStoreEmpty } from '@aws-ee/base-ui/dist/models/BaseStore';
import Form from '@aws-ee/base-ui/dist/parts/helpers/fields/Form';
import TextArea from '@aws-ee/base-ui/dist/parts/helpers/fields/TextArea';
import ErrorBox from '@aws-ee/base-ui/dist/parts/helpers/ErrorBox';

import getTriggerWorkflowForm from '../../../models/forms/TriggerWorkflowForm';
import ProgressPlaceHolder from '../../workflow-common/ProgressPlaceholder';

// expected props
// - workflowVersion (via props)
// - workflowsStore (via injection)
// - userDisplayName (via injection)
// - location (from react router)
class WorkflowInstancesList extends React.Component {
  constructor(props) {
    super(props);
    this.form = getTriggerWorkflowForm();
    runInAction(() => {
      this.triggerDialogShown = false;
    });

    const pluginRegistry = this.props.pluginRegistry;
    this.triggerForms = pluginRegistry.visitPlugins('workflows-ui', 'getTriggerForms', {});
  }

  componentDidMount() {
    if (this.disposer) this.disposer();

    this.disposer = autorun(() => {
      const store = this.getInstancesStore();
      if (!isStoreReady(store)) swallowError(store.load());
    });

    const store = this.getInstancesStore();
    store.startHeartbeat();
  }

  componentWillUnmount() {
    const store = this.getInstancesStore();
    store.stopHeartbeat();
    if (this.disposer) this.disposer();
  }

  getWorkflowVersion() {
    return this.props.workflowVersion;
  }

  getWorkflowStore() {
    const workflowVersion = this.getWorkflowVersion();
    return this.props.workflowsStore.getWorkflowStore(workflowVersion.id);
  }

  getInstancesStore() {
    const workflowStore = this.getWorkflowStore();
    const workflowVersion = this.getWorkflowVersion();
    return workflowStore.getInstancesStore(workflowVersion.id, workflowVersion.v);
  }

  getUserDisplayName() {
    return this.props.userDisplayName;
  }

  cancelTriggerDialog = () => {
    this.triggerDialogShown = false;
  };

  showTriggerDialog = () => {
    this.triggerDialogShown = true;
  };

  handleFormSubmission = async form => {
    const values = form.values();
    const workflowInputStr = values.workflowInput;

    try {
      const store = this.getInstancesStore();

      // Convert input JSON string to an input object
      const input = JSON.parse(workflowInputStr);
      await store.triggerWorkflow({ input });

      form.clear();
      this.cancelTriggerDialog();
    } catch (error) {
      if (error instanceof SyntaxError) {
        displayError('Incorrect workflow input. Make sure the workflow input is a well-formed JSON.');
      } else {
        displayError(error);
      }
    }
  };

  handleInstanceClick = event => {
    event.preventDefault();
    event.stopPropagation();

    // see https://reactjs.org/docs/events.html and https://github.com/facebook/react/issues/5733
    const instanceId = event.currentTarget.dataset.instance;
    const goto = gotoFn(this);
    const { id, v } = this.getWorkflowVersion();

    goto(`/workflows/published/id/${id}/v/${v}/instances/id/${instanceId}`);
  };

  render() {
    const store = this.getInstancesStore();
    let content = null;

    if (isStoreError(store)) {
      content = <ErrorBox error={store.error} className="p0" />;
    } else if (isStoreLoading(store)) {
      content = <ProgressPlaceHolder />;
    } else if (isStoreReady(store) && isStoreEmpty(store)) {
      content = this.renderEmptyInstances();
    } else if (isStoreReady(store) && !isStoreEmpty(store)) {
      content = this.renderMain();
    } else {
      // We get here if the store is in the initial state
      content = null;
    }

    return (
      <>
        {this.renderTriggerDialog()}
        {content}
      </>
    );
  }

  renderMain() {
    const store = this.getInstancesStore();
    const list = store.list;

    return _.map(list, instance => this.renderRow(instance));
  }

  renderRow(instance) {
    const { id, createdAt, createdBy, statusSummary } = instance;
    const userDisplayName = this.getUserDisplayName();
    const by = () => <span>{userDisplayName.getDisplayName({ uid: createdBy })}</span>;
    const { statusLabel, statusColor, stepsSummary } = statusSummary;

    return (
      <Segment
        clearing
        padded
        key={id}
        className="mb3 cursor-pointer"
        data-instance={id}
        onClick={this.handleInstanceClick}
      >
        <Grid celled="internally" stackable>
          <Grid.Row stretched>
            <Grid.Column width={3} className="center pr3">
              <Label color={statusColor} className="fluid center mb1">
                {statusLabel}
              </Label>
              <div className="mb1">
                id <b>{id}</b>
              </div>
              <TimeAgo date={createdAt} />
              {by()}
            </Grid.Column>
            <Grid.Column width={13}>
              <div className="mb2 center">Steps</div>
              <Statistic.Group widths="five" size="tiny">
                {_.map(stepsSummary, item => (
                  <Statistic key={item.statusLabel} color={item.statusColor}>
                    <Statistic.Value>{niceNumber(item.count)}</Statistic.Value>
                    <Statistic.Label>{item.statusLabel}</Statistic.Label>
                  </Statistic>
                ))}
              </Statistic.Group>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </Segment>
    );
  }

  renderEmptyInstances() {
    return (
      <Segment placeholder>
        <Header icon className="color-grey">
          <Icon name="copy outline" />
          No instances
          <Header.Subheader>
            Once the workflow is triggered at least once, you will start seeing information about the instances in this
            area.
          </Header.Subheader>
        </Header>
      </Segment>
    );
  }

  renderTriggerDialog() {
    const show = this.triggerDialogShown;

    return (
      <>
        {!show && (
          <div className="clearfix mb2">
            <Button basic color="blue" floated="right" onClick={this.showTriggerDialog}>
              Trigger
            </Button>
          </div>
        )}
        {show && this.renderTriggerDialogContent()}
      </>
    );
  }

  renderTriggerDialogContent() {
    if (Object.keys(this.triggerForms).length === 0) {
      return this.renderInitialPayloadForm();
    }

    return this.renderMultipleTriggerForms();
  }

  renderMultipleTriggerForms() {
    const panes = [];

    // This is the default JSON payload input that should appear first
    panes.push({ menuItem: 'Initial Payload', render: () => this.renderInitialPayloadForm() });

    // Add all the panes coming from the plugins
    Object.keys(this.triggerForms).forEach(key => {
      const triggerForm = this.triggerForms[key];
      panes.push(this.createTriggerFormTab(triggerForm));
    });

    return <Tab panes={panes} onTabChange={() => this.refreshInputForm()} />;
  }

  renderInitialPayloadForm() {
    const form = this.form;
    const workflowInputField = form.$('workflowInput');

    return (
      <Segment clearing className="p3 m0">
        <Form
          form={form}
          onCancel={this.cancelTriggerDialog}
          onSuccess={this.handleFormSubmission}
          onError={this.handleFormError}
        >
          {({ processing, _onSubmit, onCancel }) => (
            <>
              <TextArea field={workflowInputField} disabled={processing} />
              <div className="m0 p0">
                <Button floated="right" color="blue" icon disabled={processing} className="ml2" type="submit">
                  Trigger
                </Button>
                <Button floated="right" disabled={processing} onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </Form>
      </Segment>
    );
  }

  createTriggerFormTab(triggerForm) {
    return {
      menuItem: triggerForm.label,
      render: this.renderTriggerForm.bind(this, triggerForm),
    };
  }

  renderTriggerForm(triggerForm) {
    return (
      <Segment clearing className="p2 m0">
        <Form
          form={this.form}
          onCancel={this.cancelTriggerDialog}
          onSuccess={form => {
            this.refreshInputForm();
            return this.handleFormSubmission(form);
          }}
          onError={this.handleFormError}
        >
          {({ processing, _onSubmit, onCancel }) => (
            <>
              <Header as="h3" className="pl2 pt0 pb0 mb0" color="grey">
                {triggerForm.header}
              </Header>
              <div className="field pl2 pb2 pt1">{triggerForm.description}</div>
              <div className="pl2 pr2">
                {triggerForm.render(inputState => {
                  triggerForm.inputState = inputState;
                })}
              </div>
              <div className="p2 mb2">
                <Button
                  floated="right"
                  color="blue"
                  icon
                  className="ml2 mb2"
                  loading={processing}
                  disabled={processing}
                  type="submit"
                >
                  Trigger
                </Button>
                <Button floated="right" className="mb2" disabled={processing} onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </Form>
      </Segment>
    );
  }

  refreshInputForm() {
    const form = this.form;
    const workflowInputField = form.$('workflowInput');

    // Determine input based on other UI input builders
    let currentValue;
    try {
      if (_.isEmpty(workflowInputField.value)) {
        currentValue = {};
      } else {
        currentValue = JSON.parse(workflowInputField.value);
      }

      // eslint-disable-next-line no-empty
    } catch (_e) {}

    const inputObjectSoFar = currentValue || {};
    Object.keys(this.triggerForms).forEach(key => {
      const triggerForm = this.triggerForms[key];
      if (_.isObject(triggerForm.inputState)) {
        Object.keys(triggerForm.inputState).forEach(triggerFormInputKey => {
          inputObjectSoFar[triggerFormInputKey] = triggerForm.inputState[triggerFormInputKey];
        });
      }
    });
    workflowInputField.value = JSON.stringify(inputObjectSoFar, null, 2);
  }
}

// see https://medium.com/@mweststrate/mobx-4-better-simpler-faster-smaller-c1fbc08008da
decorate(WorkflowInstancesList, {
  triggerDialogShown: observable,
  handleInstanceClick: action,
  showTriggerDialog: action,
  cancelTriggerDialog: action,
  handleFormSubmission: action,
});

export default inject(
  'workflowsStore',
  'userDisplayName',
  'pluginRegistry',
)(withRouter(observer(WorkflowInstancesList)));
