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

import createContext from '../../../__mocks__/context.mock';
import controller from '../setup-auth-context';

describe('setup-auth-context', () => {
  let context;
  let router;
  beforeEach(async done => {
    context = createContext({});
    router = await controller(context);
    done();
  });

  describe('ALL *', () => {
    it('sets not authorized when there is no authorizer', async done => {
      const request = {};
      const response = {
        locals: {},
      };
      const next = jest.fn();

      await router.invoke('ALL', '*', request, response, next);

      expect(response).toEqual({
        locals: { authenticated: false },
      });
      expect(next).toHaveBeenCalled();
      done();
    });

    itProp(
      'sets all required fields when an authorizer is defined',
      [fc.string(), fc.string(), fc.string(), fc.string(), fc.string(), fc.string()],
      async (uid, token, username, identityProviderName, authenticationProviderId) => {
        const authorizer = {
          uid,
          token,
          username,
          identityProviderName,
          authenticationProviderId,
        };
        const request = {
          context: {
            authorizer,
          },
        };
        const response = {
          locals: {},
        };
        const next = jest.fn();

        await router.invoke('ALL', '*', request, response, next);

        expect(response).toEqual({
          locals: {
            ...authorizer,
            authenticated: true,
          },
        });
        expect(next).toHaveBeenCalled();
      },
    );
  });
});
