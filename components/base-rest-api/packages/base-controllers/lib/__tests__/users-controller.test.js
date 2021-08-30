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

import { itProp, fc } from 'jest-fast-check';

import createContext from '../../__mocks__/context.mock';
import controller from '../users-controller';

describe('users-controller', () => {
  let context;
  let userService;
  let router;
  beforeEach(async done => {
    userService = {
      listUsers: jest.fn(),
      createUser: jest.fn(),
      updateUser: jest.fn(),
      createUsers: jest.fn(),
      deleteUser: jest.fn(),
    };
    context = createContext({ userService });
    router = await controller(context);
    done();
  });

  describe('GET /', () => {
    itProp(
      'returns list of users',
      [fc.array(fc.object()), fc.string()],
      async (expectedListUsersResponse, mockUid) => {
        const response = {
          locals: {
            requestContext: {
              principal: { uid: mockUid },
            },
          },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        userService.listUsers.mockResolvedValue(expectedListUsersResponse);

        await router.invoke('GET', '/', { query: {} }, response);

        expect(userService.listUsers).toHaveBeenCalledWith(response.locals.requestContext, {
          maxResults: undefined,
          nextToken: undefined,
        });
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith(expectedListUsersResponse);
      },
    );
  });

  describe('POST /', () => {
    itProp(
      'creates a user',
      [
        fc.object(),
        fc.string(),
        fc.string(),
        fc.string(),
        fc.string(),
        fc.string(),
        fc.option(fc.boolean()),
        fc.string(),
        fc.string(),
        fc.string(),
        fc.boolean(),
        fc.object(),
      ],
      async (
        requestContext,
        identityProviderName,
        username,
        firstName,
        lastName,
        email,
        isAdmin,
        status,
        userRole,
        isExternalUser,
        createdUser,
      ) => {
        const request = {
          body: {
            identityProviderName,
            username,
            firstName,
            lastName,
            email,
            isAdmin,
            status,
            userRole,
            isExternalUser,
          },
        };
        const response = {
          locals: { requestContext },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        userService.createUser.mockResolvedValue(createdUser);

        await router.invoke('POST', '/', request, response);

        expect(userService.createUser).toHaveBeenCalledWith(requestContext, {
          identityProviderName,
          username,
          firstName,
          lastName,
          email,
          isAdmin,
          status,
          userRole,
          isExternalUser,
        });
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith(createdUser);
      },
    );
  });

  describe('POST /bulk', () => {
    itProp(
      'creates multiple users',
      [
        fc.object(),
        fc.string(),
        fc.string(),
        fc.string(),
        fc.string(),
        fc.string(),
        fc.string(),
        fc.string(),
        fc.option(fc.boolean()),
        fc.string(),
        fc.string(),
        fc.string(),
        fc.boolean(),
        fc.object(),
      ],
      async (
        requestContext,
        defaultProviderId,
        identityProviderName,
        username,
        firstName,
        lastName,
        email,
        isAdmin,
        status,
        userRole,
        isExternalUser,
        serviceResponse,
      ) => {
        const request = {
          query: { authenticationProviderId: defaultProviderId },
          body: [
            {
              identityProviderName,
              username,
              firstName,
              lastName,
              email,
              isAdmin,
              status,
              userRole,
              isExternalUser,
            },
          ],
        };
        const response = {
          locals: { requestContext },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        userService.createUsers.mockResolvedValue(serviceResponse);

        await router.invoke('POST', '/bulk', request, response);

        expect(userService.createUsers).toHaveBeenCalledWith(
          requestContext,
          [
            {
              identityProviderName,
              username,
              firstName,
              lastName,
              email,
              isAdmin,
              status,
              userRole,
              isExternalUser,
            },
          ],
          defaultProviderId,
        );
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith(serviceResponse);
      },
    );
  });

  describe('PUT /:uid', () => {
    itProp(
      'updates a user',
      [
        fc.object(),
        fc.string(),
        fc.string(),
        fc.string(),
        fc.string(),
        fc.option(fc.boolean()),
        fc.string(),
        fc.nat(),
        fc.object(),
      ],
      async (requestContext, uid, firstName, lastName, email, isAdmin, status, rev, updatedUser) => {
        const request = {
          params: {
            uid,
          },
          body: { uid, firstName, lastName, email, isAdmin, status, rev },
        };
        const response = {
          locals: { requestContext },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        userService.updateUser.mockResolvedValue(updatedUser);

        await router.invoke('PUT', '/:uid', request, response);

        expect(userService.updateUser).toHaveBeenCalledWith(requestContext, {
          uid,
          firstName,
          lastName,
          email,
          isAdmin,
          status,
          rev,
        });
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith(updatedUser);
      },
    );
  });

  describe('DELETE /:uid', () => {
    itProp(
      'delete a user',
      [fc.object(), fc.string(), fc.string(), fc.string()],
      async (requestContext, uid, authenticationProviderId, identityProviderName) => {
        const request = {
          params: { uid },
          query: {},
          body: { authenticationProviderId, identityProviderName },
        };
        const response = {
          locals: { requestContext },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        userService.deleteUser.mockResolvedValue({});

        await router.invoke('DELETE', '/:uid', request, response);

        expect(userService.deleteUser).toHaveBeenCalledWith(requestContext, {
          uid,
          authenticationProviderId,
          identityProviderName,
        });
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith({ message: `user ${uid} deleted` });
      },
    );
  });
});
