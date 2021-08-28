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

import { resolve } from '../resolver';

describe('resolver', () => {
  it('throws on malformed locator', () => {
    try {
      resolve('malformed');
    } catch (err) {
      expect(err.message).toBe('Malformed locator: malformed');
      return;
    }
    throw new Error('Expected an exception');
  });

  describe('service locator', () => {
    it('throws on malformed locator', () => {
      try {
        resolve('locator:service');
      } catch (err) {
        expect(err.message).toBe('Malformed locator: locator:service');
        return;
      }
      throw new Error('Expected an exception');
    });

    it('converts a valid locator correctly', () => {
      const result = resolve('locator:service:mockService/mockMethod');
      expect(result).toEqual({
        methodName: 'mockMethod',
        serviceName: 'mockService',
        type: 'service',
      });
    });
  });

  describe('external-url locator', () => {
    it('throws on malformed locator', () => {
      try {
        resolve('locator:external-url');
      } catch (err) {
        expect(err.message).toBe('Malformed locator: locator:external-url');
        return;
      }
      throw new Error('Expected an exception');
    });

    it('converts a valid locator correctly', () => {
      const result = resolve('locator:external-url:mockUrl');
      expect(result).toEqual({
        url: 'mockUrl',
        type: 'external-url',
      });
    });
  });
});
