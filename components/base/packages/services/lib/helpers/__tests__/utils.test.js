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

import {
  toVersionString,
  parseVersionString,
  runAndCatch,
  exponentialInterval,
  linearInterval,
  fuzz,
  randomString,
  paginatedFind,
  generateId,
  generateIdSync,
  createHash,
} from '../utils';

describe('utils', () => {
  describe('toVersionString', () => {
    it.each`
      input    | output
      ${2}     | ${'v0002_'}
      ${0}     | ${'v0000_'}
      ${9999}  | ${'v9999_'}
      ${12345} | ${'v12345_'}
    `('versions a string', ({ input, output }) => {
      expect(toVersionString(input)).toBe(output);
    });
  });

  describe('parseVersionString', () => {
    it.each`
      input        | output
      ${'v0002_'}  | ${2}
      ${'v0000_'}  | ${0}
      ${'v9999_'}  | ${9999}
      ${'v12345_'} | ${12345}
    `('versions a string', ({ input, output }) => {
      expect(parseVersionString(input)).toBe(output);
    });
  });

  describe('runAndCatch', () => {
    it('runs normally when the function behaves', async () => {
      const expectedResult = { expected: 'result' };
      const result = await runAndCatch(jest.fn().mockResolvedValue(expectedResult));
      expect(result).toBe(expectedResult);
    });

    it('handles when the error has the right code', async () => {
      const code = 'testErrorCode';
      const expectedResult = { expected: 'result' };
      const fn = jest.fn().mockRejectedValue({ code });
      const handler = jest.fn().mockReturnValue(expectedResult);
      const result = await runAndCatch(fn, handler, code);
      expect(result).toBe(expectedResult);
    });

    it('bubbles the error when it has not the right code', async () => {
      const code = 'testErrorCode';
      const fn = jest.fn().mockRejectedValue({ code: 'different code' });
      const handler = jest.fn();
      try {
        await runAndCatch(fn, handler, code);
      } catch (err) {
        expect(err.code).toBe('different code');
        expect(handler).not.toHaveBeenCalled();
        return;
      }
      throw new Error('Expected an exception');
    });
  });

  describe('.createHash', () => {
    it('returns a string', () => {
      expect(createHash('testValue')).toEqual(expect.any(String));
    });
  });

  describe('.exponentialInterval', () => {
    it.each`
      input         | output
      ${[0]}        | ${500}
      ${[1]}        | ${1000}
      ${[2]}        | ${2000}
      ${[3]}        | ${4000}
      ${[10]}       | ${512000}
      ${[0, 1000]}  | ${1000}
      ${[1, 1000]}  | ${2000}
      ${[2, 1000]}  | ${4000}
      ${[3, 1000]}  | ${8000}
      ${[10, 1000]} | ${1024000}
    `('calculates as expected', ({ input, output }) => {
      expect(exponentialInterval(...input)).toBe(output);
    });
  });

  describe('.linearInterval', () => {
    it.each`
      input        | output
      ${[0]}       | ${0}
      ${[1]}       | ${1000}
      ${[2]}       | ${2000}
      ${[3]}       | ${3000}
      ${[10]}      | ${10000}
      ${[0, 100]}  | ${0}
      ${[1, 100]}  | ${100}
      ${[2, 100]}  | ${200}
      ${[3, 100]}  | ${300}
      ${[10, 100]} | ${1000}
    `('calculates as expected', ({ input, output }) => {
      expect(linearInterval(...input)).toBe(output);
    });
  });

  describe('.paginatedFind', () => {
    it('returns the expected value', async () => {
      const listingFn = jest.fn(async nextPageToken => {
        switch (nextPageToken) {
          default:
          case 'Page1':
            return { list: ['itemA', 'itemB'], nextPageToken: 'Page2' };
          case 'Page2':
            return { list: ['itemC', 'itemD'], nextPageToken: 'Page3' };
          case 'Page3':
            return { list: ['itemE'] };
        }
      });

      const result = await paginatedFind(listingFn, item => item === 'itemC', 'Page1');

      expect(result).toBe('itemC');
      expect(listingFn).toHaveBeenCalledWith('Page1');
      expect(listingFn).toHaveBeenCalledWith('Page2');
      expect(listingFn).not.toHaveBeenCalledWith('Page3');
    });
  });

  describe('.fuzz', () => {
    it('returns numbers in the right range (default fuzzing)', () => {
      for (let i = 0; i < 10000; i += 1) {
        const result = fuzz(100);
        expect(result).toBeGreaterThanOrEqual(70);
        expect(result).toBeLessThanOrEqual(130);
      }
    });

    it('returns numbers in the right range', () => {
      for (let i = 0; i < 10000; i += 1) {
        const result = fuzz(100, 0.1);
        expect(result).toBeGreaterThanOrEqual(90);
        expect(result).toBeLessThanOrEqual(110);
      }
    });
  });

  describe('.randomString', () => {
    it('creates a string of the expected length (default)', () => {
      for (let i = 0; i < 10000; i += 1) {
        expect(randomString().length).toBe(10);
      }
    });

    it('creates a string of the expected length', () => {
      for (let i = 0; i < 10000; i += 1) {
        expect(randomString(42).length).toBe(42);
      }
    });
  });

  describe('.generateId', () => {
    it('generates an id', async () => {
      const id = await generateId();
      expect(id).toEqual(expect.any(String));
    });

    it('generates an id with prefix', async () => {
      const id = await generateId('testPrefix');
      expect(id.startsWith('testPrefix')).toBe(true);
      expect(id).toEqual(expect.any(String));
    });
  });

  describe('.generateIdSync', () => {
    it('generates an id', () => {
      const id = generateIdSync();
      expect(id).toEqual(expect.any(String));
    });

    it('generates an id with prefix', () => {
      const id = generateIdSync('testPrefix');
      expect(id.startsWith('testPrefix')).toBe(true);
      expect(id).toEqual(expect.any(String));
    });
  });
});
