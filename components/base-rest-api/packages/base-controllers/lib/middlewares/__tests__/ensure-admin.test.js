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
import controller from '../ensure-admin';

describe('ensure-admin', () => {
  let context;
  let router;
  beforeEach(async done => {
    context = createContext({});
    router = await controller(context);
    done();
  });

  describe('ALL *', () => {
    itProp('throws when the user is not admin', [fc.object()], async requestContext => {
      const response = {
        locals: { requestContext },
      };
      try {
        await router.invoke('ALL', '*', undefined, response);
      } catch (err) {
        expect(err.message).toBe('You are not authorized to perform this operation');
        expect(err.status).toBe(403);
        expect(err.safe).toBe(true);
        return;
      }
      throw new Error('Expected an exception');
    });

    itProp('continues along when the user is admin', [fc.object()], async requestContext => {
      const response = {
        locals: { requestContext: { ...requestContext, principal: { isAdmin: true } } },
      };
      const next = jest.fn();
      await router.invoke('ALL', '*', undefined, response, next);
      expect(next).toHaveBeenCalled();
    });
  });
});
