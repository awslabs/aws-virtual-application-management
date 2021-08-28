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
import controller from '../user-controller';

describe('user-controller', () => {
  let context;
  let userService;
  let router;
  beforeEach(async done => {
    userService = {
      updateUser: jest.fn(),
    };
    context = createContext({
      userService,
    });
    router = await controller(context);
    done();
  });

  describe('GET /', () => {
    itProp('returns the current principal', [fc.string()], async mockPrincipal => {
      const response = {
        locals: {
          requestContext: {
            principal: { uid: mockPrincipal },
          },
        },
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      await router.invoke('GET', '/', undefined, response);
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(response.locals.requestContext.principal);
    });
  });

  describe('PUT /', () => {
    itProp(
      'updates the user with the given values and returns the result',
      [fc.object(), fc.object(), fc.string()],
      async (mockBody, expectedUpdateUserResponse, mockUid) => {
        const request = {
          body: mockBody,
        };
        const response = {
          locals: {
            requestContext: {
              principal: { uid: mockUid },
            },
          },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        userService.updateUser.mockResolvedValue(expectedUpdateUserResponse);

        await router.invoke('PUT', '/', request, response);

        expect(userService.updateUser).toHaveBeenCalledWith(response.locals.requestContext, {
          ...request.body,
          uid: mockUid,
        });
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith(expectedUpdateUserResponse);
      },
    );
  });
});
