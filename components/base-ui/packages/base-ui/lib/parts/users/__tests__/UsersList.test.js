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
import { shallow } from 'enzyme';

import UsersList from '../UsersList';

jest.mock('../../../helpers/notification');
const notifyMock = require('../../../helpers/notification');

jest.mock('../../../helpers/routing');
const routingMock = require('../../../helpers/routing');

const usersStore = { list: [], load: jest.fn(), startHeartbeat: jest.fn(), stopHeartbeat: jest.fn() };
const userStore = {};

describe('UsersList', () => {
  let component = null;
  let wrapper = null;
  const goto = jest.fn();
  beforeEach(() => {
    // mock functions
    routingMock.gotoFn = jest.fn(() => {
      return goto;
    });
    notifyMock.displayError = jest.fn(x => x);

    // Render component
    wrapper = shallow(<UsersList.WrappedComponent usersStore={usersStore} userStore={userStore} />);

    // Get instance of the component
    component = wrapper.instance();
  });

  it('should handle goto addusers page', async () => {
    // BUILD
    // OPERATE
    component.handleAddUser();
    // CHECK
    expect(goto).toHaveBeenCalledWith('/users/add');
  });

  it('should handle goto authenticationProvider page', async () => {
    // BUILD
    // OPERATE
    component.handleAddAuthenticationProvider();
    // CHECK
    expect(goto).toHaveBeenCalledWith('/authentication-providers');
  });
});
