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

/* eslint-disable max-classes-per-file */
import _ from 'lodash';

const mockUserPoolClient = {
  UserPoolClient: {
    ClientId: 'mockUserPoolClient',
  },
};
const mockUsername = '03370318-1729-1729-1729-172903370318';
const duplicateEmail = 'flexo@bendingplant.org';

class ClientError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

const sdkMethodResp = val =>
  jest.fn().mockReturnValue({
    promise: jest.fn().mockResolvedValue(val),
  });
const mockedUserPoolMethods = {
  // App Client functions
  describeUserPoolClient: sdkMethodResp(mockUserPoolClient),
  updateUserPoolClient: sdkMethodResp(mockUserPoolClient),

  // User management functions
  adminGetUser: sdkMethodResp(),
  adminCreateUser: jest.fn(createUserArgs => {
    let promise = async () => ({ User: { Username: mockUsername } });
    if (_.get(createUserArgs, 'Username') === duplicateEmail) {
      promise = async () => {
        throw new ClientError('UsernameExistsException');
      };
    }
    return { promise };
  }),
  adminUpdateUserAttributes: sdkMethodResp(),
  adminDeleteUser: sdkMethodResp(),
};
const MockCognitoIdentityServiceProvider = jest.fn(() => mockedUserPoolMethods);

const aws = {
  sdk: { CognitoIdentityServiceProvider: MockCognitoIdentityServiceProvider },
};

export default aws;
export { mockedUserPoolMethods, mockUsername, duplicateEmail };
