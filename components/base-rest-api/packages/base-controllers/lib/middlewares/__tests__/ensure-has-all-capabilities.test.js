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
import controllerFactory from '../ensure-has-all-capabilities';

const request = {};

describe('ensure-has-all-capabilities', () => {
  let context;
  beforeEach(async done => {
    context = createContext();
    done();
  });

  describe('ensures that the user has all the specified capabilities', () => {
    itProp(
      'throws unauthorized when user does not have all the required capabilities',
      [fc.string().filter(s => !!s), fc.constantFrom(['canPerformD'], ['canPerformE'], ['canPerformD', 'canPerformE'])],
      async (uid, requiredCapabilityIds) => {
        const response = {
          locals: {
            uid,
            authenticated: true,
            requestContext: {
              authenticated: true,
              principal: {
                uid,
                capabilityIds: ['canPerformA', 'canPerformB', 'canPerformC'],
              },
              principalIdentifier: { uid },
            },
          },
        };
        const next = jest.fn();
        const configFn = await controllerFactory(requiredCapabilityIds);
        const router = await configFn(context);

        try {
          await router.invoke('ALL', '*', request, response, next);
        } catch (err) {
          expect(err.message).toBe('You are not authorized to perform this operation');
          expect(err.status).toBe(403);
          expect(err.safe).toBe(true);
          return;
        }
        throw new Error('Expected unauthorized exception');
      },
    );

    itProp(
      `let's the call go through if the user has all the required capabilities`,
      [
        fc.string().filter(s => !!s),
        fc.constantFrom(['canPerformA'], ['canPerformB', 'canPerformC'], ['canPerformA', 'canPerformB', 'canPerformC']),
      ],
      async (uid, requiredCapabilityIds) => {
        const response = {
          locals: {
            uid,
            authenticated: true,
            requestContext: {
              authenticated: true,
              principal: {
                uid,
                capabilityIds: ['canPerformA', 'canPerformB', 'canPerformC'],
              },
              principalIdentifier: { uid },
            },
          },
        };
        const next = jest.fn();
        const configFn = await controllerFactory(requiredCapabilityIds);
        const router = await configFn(context);

        // The following should not throw any error
        await router.invoke('ALL', '*', request, response, next);
      },
    );
  });
});
