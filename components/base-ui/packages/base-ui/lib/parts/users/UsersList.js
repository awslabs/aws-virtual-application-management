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
import { Button, Container, Header, Icon, Label, Dimmer, Loader, Segment, Popup } from 'semantic-ui-react';
import { withRouter } from 'react-router-dom';
import { decorate, observable, runInAction, action } from 'mobx';
import { inject, observer } from 'mobx-react';
import ReactTable from 'react-table';
import { swallowError } from '../../helpers/utils';
import { isStoreError, isStoreLoading, isStoreReady } from '../../models/BaseStore';
import { gotoFn } from '../../helpers/routing';
import ErrorBox from '../helpers/ErrorBox';
import BasicProgressPlaceholder from '../helpers/BasicProgressPlaceholder';
import DocumentationClient from '../documentation-client/DocumentationClient';

import UpdateUser from './UpdateUser';

class UsersList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // eslint-disable-next-line react/no-unused-state
      selectedRole: '',
      // eslint-disable-next-line react/no-unused-state
      identityProviderName: '',
      // eslint-disable-next-line react/no-unused-state
      isIdentityProviderNameChanged: false,
      // eslint-disable-next-line react/no-unused-state
      unchangedIdentityProviderName: '',
    };
    runInAction(() => {
      // An object that keeps track of which user is being edited
      // Each key in the object below has key as user's unique id (<ns>/<username>)
      // and value as flag indicating whether to show the editor for the user
      this.mapOfUsersBeingEdited = {};
      this.formProcessing = false;
    });
  }

  componentDidMount() {
    const store = this.getStore();
    swallowError(store.load());
    store.startHeartbeat();
  }

  componentWillUnmount() {
    const store = this.getStore();
    store.stopHeartbeat();
  }

  getStore() {
    return this.props.usersStore;
  }

  handleAddCognitoUser = () => {
    const goto = gotoFn(this);
    goto('/users/add/cognito');
  };

  handleAddUser = () => {
    const goto = gotoFn(this);
    goto('/users/add');
  };

  handleAddAuthenticationProvider = () => {
    const goto = gotoFn(this);
    goto('/authentication-providers');
  };

  renderHeader() {
    return (
      <div className="mb3 flex">
        <Header as="h3" className="color-grey mt1 mb0 flex-auto">
          <Icon name="users" className="align-top" />
          <Header.Content className="left-align">
            Users
            {this.renderTotal()}
          </Header.Content>
        </Header>
        <Button color="blue" size="medium" className="mr2" basic onClick={this.handleAddCognitoUser}>
          Add Cognito User
        </Button>
        <Button color="blue" size="medium" basic onClick={this.handleAddUser}>
          Add Federated User
        </Button>
      </div>
    );
  }

  renderTotal() {
    const store = this.getStore();
    if (isStoreError(store) || isStoreLoading(store)) return null;
    const count = store.list.length;

    return <Label circular>{count}</Label>;
  }

  renderMain() {
    return this.renderUsers();
  }

  renderUsers() {
    // Read "this.mapOfUsersBeingEdited" in the "render" method here
    // The usersBeingEditedMap is then used in the ReactTable
    // If we directly use this.mapOfUsersBeingEdited in the ReactTable's cell method, MobX does not
    // realize that it is being used in the outer component's "render" method's scope
    // Due to this, MobX does not re-render the component when observable state changes.
    // To make this work correctly, we need to access "this.mapOfUsersBeingEdited" out side of ReactTable once

    const store = this.getStore();
    const usersList = store.list;
    const pageSize = usersList.length;
    const showPagination = usersList.length > pageSize;
    const processing = this.formProcessing;

    return (
      // TODO: add api token stats and active flag here in the table
      <Segment basic className="p0">
        <Dimmer active={processing} inverted>
          <Loader inverted>Updating</Loader>
        </Dimmer>
        <ReactTable
          data={usersList}
          defaultSorted={[{ id: 'lastName', desc: true }]}
          showPagination={showPagination}
          defaultPageSize={pageSize}
          className="-striped -highlight"
          filterable
          defaultFilterMethod={(filter, row) => {
            const columnValue = String(row[filter.id]).toLowerCase();
            const filterValue = filter.value.toLowerCase();
            return columnValue.indexOf(filterValue) >= 0;
          }}
          columns={[
            {
              Header: 'Username',
              accessor: 'username',
              width: 200,
            },
            {
              Header: 'Email',
              accessor: 'email',
              width: 200,
            },
            {
              Header: 'Identity Provider',
              accessor: 'identityProviderName',
              Cell: row => {
                const user = row.original;
                return user.identityProviderName || 'internal';
              },
            },
            {
              Header: 'Type',
              accessor: 'isExternalUser',
              width: 100,
              Cell: row => {
                const user = row.original;
                return user.isExternalUser ? 'External' : 'Internal';
              },
              filterMethod: filter => {
                if (filter.value.toLowerCase().includes('ex')) {
                  return false;
                }
                return true;
              },
            },
            {
              Header: 'Role',
              accessor: 'userRole',
              width: 100,
              style: { whiteSpace: 'unset' },
              Cell: row => {
                const user = row.original;
                return user.userRole || 'N/A';
              },
            },
            {
              Header: 'Status',
              accessor: 'isActive',
              width: 100,
              Cell: row => {
                const user = row.original;
                let label = null;
                if (user.status === 'active') {
                  label = (
                    <span>
                      <Label color="green">
                        <i className="check circle outline icon" />
                        Active
                      </Label>
                    </span>
                  );
                } else if (user.status === 'inactive') {
                  label = (
                    <span>
                      <Label color="red">
                        <i className="circle icon" />
                        Inactive
                      </Label>
                    </span>
                  );
                } else {
                  label = (
                    <span>
                      <Label color="orange">
                        <i className="exclamation icon" />
                        Pending
                      </Label>
                    </span>
                  );
                }
                return label;
              },
              filterMethod: (filter, row) => {
                if (row._original.status.indexOf(filter.value.toLowerCase()) >= 0) {
                  return true;
                }
                return false;
              },
            },
            {
              Header: '',
              filterable: false,
              Cell: cell => {
                const user = cell.original;
                return (
                  <div style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                    <span>
                      <Popup
                        content="View User Detail"
                        trigger={
                          <UpdateUser
                            user={user}
                            adminMode
                            userStore={this.props.userStore}
                            usersStore={this.props.usersStore}
                            userRolesStore={this.props.userRolesStore}
                          />
                        }
                      />
                    </span>
                  </div>
                );
              },
            },
          ]}
        />
      </Segment>
    );
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
    }

    return (
      <Container className="mt3 animated fadeIn">
        <DocumentationClient urlSuffix="user_guide/sidebar/admin/users/introduction" />
        {this.renderHeader()}
        {content}
      </Container>
    );
  }
}

// see https://medium.com/@mweststrate/mobx-4-better-simpler-faster-smaller-c1fbc08008da
decorate(UsersList, {
  mapOfUsersBeingEdited: observable,
  formProcessing: observable,
  handleAddCognitoUser: action,
  handleAddUser: action,
  handleAddAuthenticationProvider: action,
});

export default inject('userStore', 'usersStore', 'userRolesStore')(withRouter(observer(UsersList)));
