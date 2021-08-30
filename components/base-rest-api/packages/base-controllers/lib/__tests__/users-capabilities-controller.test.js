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
import controller from '../user-capabilities-controller';

describe('users-capabilities-controller', () => {
  let context;
  let userCapabilitiesService;
  let router;
  beforeEach(async done => {
    userCapabilitiesService = {
      list: jest.fn(),
    };
    context = createContext({
      userCapabilitiesService,
    });
    router = await controller(context);
    done();
  });

  describe('GET /', () => {
    itProp(
      'returns list of user capabilities',
      [fc.array(fc.object()), fc.string()],
      async (expectedListUserCapabilitiesResponse, mockUid) => {
        const response = {
          locals: {
            requestContext: {
              principal: { uid: mockUid },
            },
          },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        userCapabilitiesService.list.mockResolvedValue(expectedListUserCapabilitiesResponse);

        await router.invoke('GET', '/', { query: {} }, response);

        expect(userCapabilitiesService.list).toHaveBeenCalled();
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith(expectedListUserCapabilitiesResponse);
      },
    );
  });
});
