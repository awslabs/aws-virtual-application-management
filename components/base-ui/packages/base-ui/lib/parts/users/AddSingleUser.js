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
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { decorate, computed, runInAction } from 'mobx';
import { Segment, Button } from 'semantic-ui-react';

import { displaySuccess, displayError } from '../../helpers/notification';

import Stores from '../../models/Stores';
import BasicProgressPlaceholder from '../helpers/BasicProgressPlaceholder';
import { swallowError } from '../../helpers/utils';
import Form from '../helpers/fields/Form';
import YesNo from '../helpers/fields/YesNo';
import { gotoFn } from '../../helpers/routing';
import ErrorBox from '../helpers/ErrorBox';
import DropDown from '../helpers/fields/DropDown';
import Input from '../helpers/fields/Input';
import { getAddUserForm, getAddUserFormFields } from '../../models/forms/AddUserForm';
import { toIdpFromValue, toIdpOptions } from '../../models/forms/UserFormUtils';

// expected props
// - userStore (via injection)
// - usersStore (via injection)
// - userRolesStore (via injection)
// - authenticationProviderConfigsStore (via injection)
class AddSingleUser extends React.Component {
  constructor(props) {
    super(props);
    runInAction(() => {
      this.stores = new Stores([
        this.userStore,
        this.usersStore,
        this.userRolesStore,
        this.authenticationProviderConfigsStore,
      ]);
    });
    this.form = getAddUserForm();
    this.addUserFormFields = getAddUserFormFields();
  }

  componentDidMount() {
    swallowError(this.getStores().load());
  }

  render() {
    const stores = this.getStores();
    let content = null;
    if (stores.hasError) {
      content = <ErrorBox error={stores.error} className="p0 mb3" />;
    } else if (stores.loading) {
      content = <BasicProgressPlaceholder />;
    } else if (stores.ready) {
      content = this.renderMain();
    } else {
      content = null;
    }

    return content;
  }

  renderMain() {
    const form = this.form;
    const usernameField = form.$('username');
    const emailField = form.$('email');
    const identityProviderNameField = form.$('identityProviderName');
    const firstNameField = form.$('firstName');
    const lastNameField = form.$('lastName');
    const userRoleField = form.$('userRole');
    const statusField = form.$('status');

    const identityProviderOptions = this.getIdentityProviderOptions();
    const userRoleOptions = this.getUserRoleOptions();

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
              <Input field={usernameField} disabled={processing} />
              <Input field={emailField} disabled={processing} />
              <DropDown
                field={identityProviderNameField}
                options={identityProviderOptions}
                selection
                fluid
                disabled={processing}
              />
              <Input field={firstNameField} disabled={processing} />
              <Input field={lastNameField} disabled={processing} />
              <DropDown field={userRoleField} options={userRoleOptions} selection fluid disabled={processing} />

              <YesNo field={statusField} disabled={processing} />

              <div className="mt3">
                <Button floated="right" color="blue" icon disabled={processing} className="ml2" type="submit">
                  Add User
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

  getIdentityProviderOptions() {
    return toIdpOptions(this.authenticationProviderConfigsStore.list);
  }

  getUserRoleOptions() {
    return this.userRolesStore.dropdownOptions;
  }

  // Private methods
  handleCancel = () => {
    const goto = gotoFn(this);
    goto('/users');
  };

  handleFormSubmission = async form => {
    const values = form.values();

    // The values.identityProviderName is in JSON string format
    // containing authentication provider id as well as identity provider name
    // See "src/models/forms/UserFormUtils.js" for more details.
    const idpOptionValue = toIdpFromValue(values.identityProviderName) || {};
    const identityProviderName = idpOptionValue.idpName;
    const authenticationProviderId = idpOptionValue.authNProviderId;

    if (_.isEmpty(identityProviderName)) {
      displayError('No identity provider has been specified. Unable to create user');
      return;
    }

    try {
      await this.usersStore.addUser({ ...values, authenticationProviderId, identityProviderName });
      form.clear();
      displaySuccess('Added user successfully');

      const goto = gotoFn(this);
      goto('/users');
    } catch (error) {
      displayError(error);
    }
  };

  // eslint-disable-next-line no-unused-vars
  handleFormError = (_form, _errors) => {
    // We don't need to do anything here
  };

  getStores() {
    return this.stores;
  }

  get userStore() {
    return this.props.userStore;
  }

  get usersStore() {
    return this.props.usersStore;
  }

  get userRolesStore() {
    return this.props.userRolesStore;
  }

  get authenticationProviderConfigsStore() {
    return this.props.authenticationProviderConfigsStore;
  }
}

// see https://medium.com/@mweststrate/mobx-4-better-simpler-faster-smaller-c1fbc08008da
decorate(AddSingleUser, {
  userStore: computed,
  usersStore: computed,
  userRolesStore: computed,
  authenticationProviderConfigsStore: computed,
});

export default inject(
  'userStore',
  'usersStore',
  'userRolesStore',
  'authenticationProviderConfigsStore',
)(withRouter(observer(AddSingleUser)));
