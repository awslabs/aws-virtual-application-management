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
import controller from '../user-roles-controller';

describe('users-roles-controller', () => {
  let context;
  let userRolesService;
  let router;
  beforeEach(async done => {
    userRolesService = {
      list: jest.fn(),
    };
    context = createContext({
      userRolesService,
    });
    router = await controller(context);
    done();
  });

  describe('GET /', () => {
    itProp(
      'returns list of user roles',
      [fc.array(fc.object()), fc.string()],
      async (expectedListUserRolesResponse, mockUid) => {
        const response = {
          locals: {
            requestContext: {
              principal: { uid: mockUid },
            },
          },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        userRolesService.list.mockResolvedValue(expectedListUserRolesResponse);

        await router.invoke('GET', '/', { query: {} }, response);

        expect(userRolesService.list).toHaveBeenCalled();
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith(expectedListUserRolesResponse);
      },
    );
  });
});
