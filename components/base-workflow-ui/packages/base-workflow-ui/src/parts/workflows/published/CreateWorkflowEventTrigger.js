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
import { decorate, action, runInAction } from 'mobx';
import { Segment, Button } from 'semantic-ui-react';
import { displayError } from '@aws-ee/base-ui/dist/helpers/notification';
import Stores from '@aws-ee/base-ui/dist/models/Stores';
import ErrorBox from '@aws-ee/base-ui/dist/parts/helpers/ErrorBox';
import Form from '@aws-ee/base-ui/dist/parts/helpers/fields/Form';
import TextArea from '@aws-ee/base-ui/dist/parts/helpers/fields/TextArea';

import getCreateEventTriggerForm from '../../../models/forms/CreateWorkflowEventTriggerForm';
import ProgressPlaceHolder from '../../workflow-common/ProgressPlaceholder';

// expected props
// - onCancel (via prop) called on cancel
// - workflowsStore (via injection)
// - workflowId (via prop)
// - workflowVer (via prop)
class CreateWorkflowEventTrigger extends React.Component {
  constructor(props) {
    super(props);
    this.form = getCreateEventTriggerForm();
    runInAction(() => {
      this.stores = new Stores([this.props.workflowsStore]);
    });
  }

  componentDidMount() {
    this.getStores().load();
  }

  getEventTriggersStore() {
    const workflowStore = this.getWorkflowStore();
    return workflowStore.getEventTriggersStore();
  }

  getStores() {
    return this.stores;
  }

  getWorkflowVersion() {
    return this.props.workflowVersion;
  }

  getWorkflowStore() {
    const version = this.getWorkflowVersion();
    return this.props.workflowsStore.getWorkflowStore(version.id);
  }

  handleCancel = () => {
    const onCancel = this.props.onCancel || _.noop;
    onCancel();
  };

  handleFormError = (_form, _errors) => {
    // We don't need to do anything here
  };

  handleFormSubmission = async form => {
    const values = form.values();
    const workflowVersion = this.getWorkflowVersion();
    try {
      await this.getEventTriggersStore().create({
        workflowId: workflowVersion.id,
        workflowVer: workflowVersion.v,
        ...values,
      });
      form.clear();
      this.handleCancel();
    } catch (error) {
      displayError(error);
    }
  };

  render() {
    const stores = this.getStores();
    let content = null;

    if (stores.hasError) {
      content = <ErrorBox error={stores.error} className="p0 mb3" />;
    } else if (stores.loading) {
      content = <ProgressPlaceHolder />;
    } else if (stores.ready) {
      content = this.renderMain();
    } else {
      content = null;
    }

    return content;
  }

  renderMain() {
    const form = this.form;

    const eventPatternField = form.$('eventPattern');

    return (
      <Segment clearing className="p3">
        <Form
          form={form}
          onCancel={this.handleCancel}
          onSuccess={this.handleFormSubmission}
          onError={this.handleFormError}
        >
          {({ processing, _onSubmit, onCancel }) => (
            <>
              <TextArea field={eventPatternField} rows={6} disabled={processing} />
              <div className="mt3">
                <Button floated="right" color="blue" icon disabled={processing} className="ml2" type="submit">
                  Create Event Trigger
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
}

// see https://medium.com/@mweststrate/mobx-4-better-simpler-faster-smaller-c1fbc08008da
decorate(CreateWorkflowEventTrigger, {
  handleCancel: action,
  handleFormSubmission: action,
  handleFormError: action,
});

export default inject('workflowsStore')(observer(CreateWorkflowEventTrigger));
