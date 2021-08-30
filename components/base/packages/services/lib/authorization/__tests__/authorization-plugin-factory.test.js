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

import factory from '../authorization-plugin-factory';

const authorizationServiceName = 'testAuthSrvName';

// TODO: only happy path testing for now, revisit later
describe('authorization-plugin-factory', () => {
  let sut;
  beforeEach(() => {
    sut = factory(authorizationServiceName);
  });

  it('authorizes', async () => {
    const ctx = { request: 'context' };
    const authResult = { some: 'result' };
    const authorizer = jest.fn().mockResolvedValue(authResult);
    const container = {
      find: jest.fn().mockResolvedValue({
        authorize: authorizer,
      }),
    };
    const payload = { resource: 'testResource', action: 'testAction', effect: 'testEffect', reason: 'testReason' };

    const result = await sut.authorize(ctx, container, payload, 'arg0', 'arg1');

    expect(container.find).toHaveBeenCalledWith(authorizationServiceName);
    expect(authorizer).toHaveBeenCalledWith(ctx, payload, 'arg0', 'arg1');
    expect(result).toBe(authResult);
  });
});
