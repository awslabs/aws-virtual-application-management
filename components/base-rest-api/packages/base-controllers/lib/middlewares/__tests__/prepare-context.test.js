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

import { RequestContext } from '@aws-ee/base-services-container';

import createContext from '../../../__mocks__/context.mock';
import controller from '../prepare-context';

const i18n = 'i18n';
const request = {
  i18n,
};

describe('prepare-context', () => {
  let context;
  let userService;
  let router;
  beforeEach(async done => {
    userService = {
      mustFindUser: jest.fn(),
    };
    context = createContext({
      userService,
    });
    router = await controller(context);
    done();
  });

  describe('ALL *', () => {
    it('prepares the context for non-authenticated users', async done => {
      const response = { locals: {} };
      const next = jest.fn();

      await router.invoke('ALL', '*', request, response, next);

      expect(response).toEqual({
        locals: {
          requestContext: new RequestContext(),
        },
      });

      done();
    });

    itProp(
      'prepares the context for authenticated users',
      [fc.string().filter(s => !!s), fc.object()],
      async (uid, user) => {
        const response = { locals: { uid, authenticated: true } };
        const next = jest.fn();
        userService.mustFindUser.mockResolvedValue(user);

        await router.invoke('ALL', '*', request, response, next);

        const expectedResponse = {
          locals: {
            requestContext: new RequestContext(),
          },
        };
        expectedResponse.locals.authenticated = true;
        expectedResponse.locals.uid = uid;
        expectedResponse.locals.requestContext.authenticated = true;
        expectedResponse.locals.requestContext.principal = user;
        expectedResponse.locals.requestContext.principalIdentifier = { uid };
        expectedResponse.locals.requestContext.i18n = i18n;

        expect(response).toEqual(expectedResponse);
      },
    );
  });
});
