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

import ServicesContainerMock from '../../__mocks__/services-container.mock';
import userManagementPlugin from '../user-management-plugin';

// Mocks
const mockedUserManagementFns = {
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
};
const MockCognitoUserManagementService = jest.fn().mockImplementation(() => mockedUserManagementFns);

// Tests
describe('userManagementPlugin', () => {
  let container;

  beforeEach(async () => {
    container = new ServicesContainerMock({
      cognitoUserManagementService: new MockCognitoUserManagementService(),
    });
    await container.initServices();
  });

  describe('.createUser', () => {
    it('calls cognitoUserManagementService.createUser()', async done => {
      const userSoFar = { email: 'hubert.farnsworth@planetexpress.org', firstName: 'Hubert', lastName: 'Farnsworth' };
      await userManagementPlugin.createUser(userSoFar, { container });
      expect(mockedUserManagementFns.createUser).toHaveBeenCalledWith(userSoFar);
      done();
    });
  });

  describe('.updateUser', () => {
    it('calls cognitoUserManagementService.createUser()', async done => {
      const userUpdatesSoFar = { firstName: 'Hermes', lastName: 'Conrad' };
      const existingUser = { email: 'hermes.conrad@planetexpress.org' };
      await userManagementPlugin.updateUser(userUpdatesSoFar, { container, existingUser });
      expect(mockedUserManagementFns.updateUser).toHaveBeenCalledWith(userUpdatesSoFar, existingUser);
      done();
    });
  });

  describe('.deleteUser', () => {
    it('calls cognitoUserManagementService.createUser()', async done => {
      const user = { username: 'zapp.brannigan@democraticorderofplanets.gov' };
      await userManagementPlugin.deleteUser({ container, user });
      expect(mockedUserManagementFns.deleteUser).toHaveBeenCalledWith(user);
      done();
    });
  });
});
