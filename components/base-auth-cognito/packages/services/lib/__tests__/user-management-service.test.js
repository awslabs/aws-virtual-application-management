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

import aws, { mockedUserPoolMethods, mockUsername, duplicateEmail } from '../__mocks__/aws.mock';
import ServicesContainerMock from '../__mocks__/services-container.mock';
import { getUserPoolIdFromAuthProviderId, userRecordToCognitoAttrs } from '../helpers/utils';
import UserManagementService from '../user-management-service';

// Mock values
jest.mock('../helpers/utils');

const mockPoolId = 'us-east-1_abcd12345';
const mockProviderIds = {
  cognito: 'mockCognitoId',
  nonCognito: 'mockNonCognitoId',
};

const mockBaseUserRecord = {
  email: 'bender.bending.rodriguez@planetexpress.org',
  firstName: 'Bender',
  lastName: 'Rodriguez',
};
const mockUserRecords = {
  cognito: {
    authenticationProviderId: mockProviderIds.cognito,
    ...mockBaseUserRecord,
  },
  nonCognito: {
    authenticationProviderId: mockProviderIds.nonCognito,
    ...mockBaseUserRecord,
  },
};

const mockCognitoAttrs = [
  { Name: 'email', Value: mockBaseUserRecord.email },
  { Name: 'given_name', Value: mockBaseUserRecord.firstName },
  { Name: 'family_name', Value: mockBaseUserRecord.lastName },
];
const mockCognitoCreateUserParams = {
  UserPoolId: mockPoolId,
  Username: mockBaseUserRecord.email,
  UserAttributes: mockCognitoAttrs,
};

const mockServiceCreateUserResp = {
  ...mockUserRecords.cognito,
  username: mockBaseUserRecord.email,
  identityProviderName: `Cognito (${mockPoolId})`,
  uid: mockUsername,
};

const userExistsErrorMsg = 'Cannot add user. The user already exists.';

// Tests
describe('UserManagementService', () => {
  let sut;
  let container;

  beforeEach(async done => {
    jest.clearAllMocks();
    sut = new UserManagementService();
    container = new ServicesContainerMock({
      sut,
      aws,
      userService: { userExistsErrorMsg },
    });
    await container.initServices();
    getUserPoolIdFromAuthProviderId.mockReturnValue(mockPoolId);
    userRecordToCognitoAttrs.mockReturnValue(mockCognitoAttrs);
    mockedUserPoolMethods.adminGetUser.mockReturnValue({
      promise: async () => ({ UserAttributes: mockCognitoAttrs }),
    });
    done();
  });

  describe('.createUser', () => {
    it('returns a non-Cognito user as-is', async done => {
      getUserPoolIdFromAuthProviderId.mockReturnValueOnce(undefined);

      const userSoFar = mockUserRecords.nonCognito;
      const finalUser = await sut.createUser(userSoFar);

      expect(mockedUserPoolMethods.adminCreateUser).not.toHaveBeenCalled();
      expect(finalUser).toEqual(userSoFar);
      done();
    });

    it('returns a SAML-authenticated user as-is', async done => {
      getUserPoolIdFromAuthProviderId.mockReturnValueOnce(mockProviderIds.cognito);

      const userSoFar = {
        ...mockUserRecords.cognito,
        isSamlAuthenticatedUser: true,
      };
      const finalUser = await sut.createUser(userSoFar);

      expect(mockedUserPoolMethods.adminCreateUser).not.toHaveBeenCalled();
      expect(finalUser).toEqual(userSoFar);
      done();
    });

    it("calls Cognito's AdminCreateUser API with a mock user", async done => {
      const userSoFar = mockUserRecords.cognito;
      const finalUser = await sut.createUser(userSoFar);

      expect(mockedUserPoolMethods.adminCreateUser).toHaveBeenCalledWith(mockCognitoCreateUserParams);
      expect(finalUser).toEqual(mockServiceCreateUserResp);
      done();
    });

    it('calls AdminCreateUser with "MessageAction" set to "SUPPRESS"', async done => {
      const temporaryPassword = 'P1@n3t3xpr355!';
      const userSoFar = { ...mockUserRecords.cognito, temporaryPassword };
      const finalUser = await sut.createUser(userSoFar);

      expect(mockedUserPoolMethods.adminCreateUser).toHaveBeenCalledWith({
        ...mockCognitoCreateUserParams,
        TemporaryPassword: temporaryPassword,
        MessageAction: 'SUPPRESS',
      });
      expect(finalUser).toEqual({ ...mockServiceCreateUserResp, temporaryPassword });
      done();
    });

    it(`fails with "${userExistsErrorMsg}"`, async done => {
      const userSoFar = { ...mockUserRecords.cognito, email: duplicateEmail };

      const mockAttrs = _.map(mockCognitoCreateUserParams.UserAttributes, attr =>
        attr.Name === 'email' ? { Name: 'email', Value: duplicateEmail } : attr,
      );
      userRecordToCognitoAttrs.mockReturnValue(mockAttrs);
      const expectedCreateUserParams = {
        ...mockCognitoCreateUserParams,
        Username: duplicateEmail,
        UserAttributes: mockAttrs,
      };

      await expect(sut.createUser(userSoFar)).rejects.toThrow(userExistsErrorMsg);
      expect(mockedUserPoolMethods.adminCreateUser).toHaveBeenCalledWith(expectedCreateUserParams);
      done();
    });
  });

  describe('.updateUser', () => {
    it('returns updates for a non-Cognito user as-is', async done => {
      getUserPoolIdFromAuthProviderId.mockReturnValueOnce(undefined);

      const userUpdatesSoFar = { firstName: 'Phillip', lastName: 'Fry' };
      const existingUser = mockUserRecords.nonCognito;
      const finalUpdates = await sut.updateUser(userUpdatesSoFar, existingUser);

      expect(mockedUserPoolMethods.adminUpdateUserAttributes).not.toHaveBeenCalled();
      expect(finalUpdates).toEqual(userUpdatesSoFar);
      done();
    });

    it("calls Cognito's AdminUpdateUserAttributes with mock updates", async done => {
      const existingUser = mockServiceCreateUserResp;
      const userUpdatesSoFar = { firstName: 'Turanga', lastName: 'Leela' };
      const updatedCognitoAttrs = [
        {
          Name: 'given_name',
          Value: 'Turanga',
        },
        {
          Name: 'family_name',
          Value: 'Leela',
        },
      ];

      userRecordToCognitoAttrs.mockReturnValue(updatedCognitoAttrs);
      const expectedCognitoUpdateParams = {
        ...mockCognitoCreateUserParams,
        UserAttributes: updatedCognitoAttrs,
      };

      const finalUpdates = await sut.updateUser(userUpdatesSoFar, existingUser);

      expect(mockedUserPoolMethods.adminUpdateUserAttributes).toHaveBeenCalledWith(expectedCognitoUpdateParams);
      expect(finalUpdates).toEqual(userUpdatesSoFar);
      done();
    });

    it('does not call AdminUpdateUserAttributes', async done => {
      const existingUser = mockServiceCreateUserResp;
      const userUpdatesSoFar = {
        firstName: mockBaseUserRecord.firstName,
        lastName: mockBaseUserRecord.lastName,
        userRole: 'guest',
      };
      const finalUpdates = await sut.updateUser(userUpdatesSoFar, existingUser);

      expect(mockedUserPoolMethods.adminUpdateUserAttributes).not.toHaveBeenCalled();
      expect(finalUpdates).toEqual(userUpdatesSoFar);
      done();
    });
  });

  describe('.deleteUser', () => {
    it("does not call Cognito's AdminDeleteUser API for a non-Cognito user", async done => {
      getUserPoolIdFromAuthProviderId.mockReturnValueOnce(undefined);

      const user = mockUserRecords.nonCognito;
      await sut.deleteUser(user);

      expect(mockedUserPoolMethods.adminDeleteUser).not.toHaveBeenCalled();
      done();
    });

    it('calls AdminDeleteUser', async done => {
      const user = { ...mockUserRecords.cognito, username: mockUsername };
      const expectedCognitoDeleteParams = {
        UserPoolId: mockPoolId,
        Username: mockUsername,
      };

      await sut.deleteUser(user);

      expect(mockedUserPoolMethods.adminDeleteUser).toHaveBeenCalledWith(expectedCognitoDeleteParams);
      done();
    });
  });
});
