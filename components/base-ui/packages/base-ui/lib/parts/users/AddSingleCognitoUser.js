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
import { computed, decorate, observable, runInAction, action } from 'mobx';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Container, Header, Icon, Segment, Button } from 'semantic-ui-react';

import { displaySuccess, displayError } from '../../helpers/notification';
import Stores from '../../models/Stores';
import BasicProgressPlaceholder from '../helpers/BasicProgressPlaceholder';
import { swallowError } from '../../helpers/utils';
import ErrorBox from '../helpers/ErrorBox';
import { gotoFn } from '../../helpers/routing';
import Form from '../helpers/fields/Form';
import YesNo from '../helpers/fields/YesNo';
import DropDown from '../helpers/fields/DropDown';
import Input from '../helpers/fields/Input';

import { isStoreLoading, isStoreReady } from '../../models/BaseStore';
import { getAddUserForm } from '../../models/forms/AddLocalUserForm';

// expected props
// - userRolesStore (via injection)
// - usersStore (via injection)
// - authenticationProviderConfigsStore (via injection)
class AddSingleCognitoUser extends React.Component {
  constructor(props) {
    super(props);
    runInAction(() => {
      this.stores = new Stores([this.userRolesStore, this.authenticationProviderConfigsStore]);
      this.form = getAddUserForm();
    });
  }

  componentDidMount() {
    swallowError(this.stores.load());
  }

  get userRolesStore() {
    return this.props.userRolesStore;
  }

  get usersStore() {
    return this.props.usersStore;
  }

  get authenticationProviderConfigsStore() {
    return this.props.authenticationProviderConfigsStore;
  }

  gotoUsersList() {
    const goto = gotoFn(this);
    goto('/users');
  }

  // Private methods
  handleCancel = () => {
    this.gotoUsersList();
  };

  handleFormSubmission = async form => {
    const values = form.values();

    try {
      await this.usersStore.addUser({
        ...values,
        username: values.email,
        authenticationProviderId: this.authenticationProviderConfigsStore.cognitoAuthProvider.id,
      });
      runInAction(() => {
        form.clear();
      });
      displaySuccess('Added local user successfully');

      this.gotoUsersList();
    } catch (error) {
      displayError(error);
    }
  };

  render() {
    const stores = this.stores;
    let content = null;
    if (stores.hasError) {
      content = <ErrorBox error={stores.error} className="p0 mb3" />;
    } else if (isStoreLoading(stores)) {
      content = <BasicProgressPlaceholder />;
    } else if (isStoreReady(stores)) {
      content = this.renderContent();
    } else {
      content = null;
    }

    return (
      <Container className="mt3 mb4">
        {this.renderTitle()}
        {content}
      </Container>
    );
  }

  renderTitle() {
    return (
      <div className="mb3 flex">
        <Header as="h3" className="color-grey mt1 mb0 flex-auto">
          <Icon name="user" className="align-top" />
          <Header.Content className="left-align">Add Cognito User</Header.Content>
        </Header>
      </div>
    );
  }

  renderContent() {
    const form = this.form;
    const emailField = form.$('email');
    const firstNameField = form.$('firstName');
    const lastNameField = form.$('lastName');
    const userRoleField = form.$('userRole');
    const statusField = form.$('status');

    const userRoleOptions = this.userRolesStore.dropdownOptions;

    return (
      <Segment clearing className="p3">
        <Form form={form} onCancel={this.handleCancel} onSuccess={this.handleFormSubmission}>
          {({ processing, onCancel }) => (
            <>
              <Input field={emailField} disabled={processing} />
              <Input field={firstNameField} disabled={processing} />
              <Input field={lastNameField} disabled={processing} />
              <DropDown field={userRoleField} options={userRoleOptions} selection fluid disabled={processing} />

              <YesNo field={statusField} disabled={processing} />

              <div className="mt3">
                <Button floated="right" color="blue" icon disabled={processing} className="ml2" type="submit">
                  Add Cognito User
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

decorate(AddSingleCognitoUser, {
  userRolesStore: computed,
  usersStore: computed,
  stores: observable,
  form: observable,
  handleCancel: action,
  handleFormSubmission: action,
});

export default inject(
  'userRolesStore',
  'usersStore',
  'authenticationProviderConfigsStore',
)(withRouter(observer(AddSingleCognitoUser)));
