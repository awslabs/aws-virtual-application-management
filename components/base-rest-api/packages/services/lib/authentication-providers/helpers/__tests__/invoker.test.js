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

import { newInvoker } from '../invoker';

describe('invoker', () => {
  it('throws on external url', async done => {
    try {
      await newInvoker()('locator:external-url:mockUrl');
    } catch (err) {
      expect(err.message).toBe('unsupported locator type: external-url');
      done();
    }
  });

  it('throws on unknown service', async done => {
    try {
      await newInvoker(() => {})('locator:service:mockService:mockMethod');
    } catch (err) {
      expect(err.message).toBe('unknown service: mockService');
      done();
    }
  });

  it('invokes a known service methos and passes args', async done => {
    const mockMethod = jest.fn();
    await newInvoker(async () => ({ mockMethod }))('locator:service:mockService/mockMethod', 'testArg1', 42);
    expect(mockMethod).toHaveBeenCalledWith('testArg1', 42);
    done();
  });
});
