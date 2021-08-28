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
import _ from 'lodash';

import createContext from '../../../__mocks__/context.mock';
import controller from '../add-capabilities-to-context';

const request = {};

describe('add-capabilities-to-context', () => {
  let context;
  let userService;
  let userRolesService;
  let router;
  beforeEach(async done => {
    userService = {
      mustFindUser: jest.fn(),
    };
    userRolesService = {
      mustFind: jest.fn(),
    };
    context = createContext({
      userService,
      userRolesService,
    });
    router = await controller(context);
    done();
  });

  describe('ALL *', () => {
    itProp(
      'adds the user capabilities to the request context',
      [
        fc.string().filter(s => !!s),
        fc.object(),
        fc.constantFrom(
          null,
          undefined,
          [],
          [{ id: 'canDoA', description: 'can perform action A' }],
          [
            { id: 'canDoA', description: 'can perform action A' },
            { id: 'canDoB', description: 'can perform action B' },
          ],
        ),
      ],
      async (uid, user, capabilities) => {
        const response = {
          locals: {
            uid,
            authenticated: true,
            requestContext: { authenticated: true, principal: user, principalIdentifier: { uid } },
          },
        };
        const next = jest.fn();
        userService.mustFindUser.mockResolvedValue(user);
        userRolesService.mustFind.mockResolvedValue({ capabilities });

        await router.invoke('ALL', '*', request, response, next);

        const expectedResponse = {
          locals: {
            requestContext: {},
          },
        };
        expectedResponse.locals.authenticated = true;
        expectedResponse.locals.uid = uid;
        expectedResponse.locals.requestContext.authenticated = true;
        expectedResponse.locals.requestContext.principal = user;
        expectedResponse.locals.requestContext.principalIdentifier = { uid };
        expectedResponse.locals.requestContext.principal.capabilityIds = _.map(capabilities, 'id');

        expect(response).toEqual(expectedResponse);
      },
    );
  });
});
