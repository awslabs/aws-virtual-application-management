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

import { setSidebarsEntry } from '../update-config-utils';

describe('update-config-utils', () => {
  describe('setSidebarsEntry', () => {
    it('updates existing path (empty array at leaf)', () => {
      const object = {
        a: {
          b: [],
        },
      };
      const path = 'a.b';
      const value = 'foo';

      expect(setSidebarsEntry(object, path, value)).toEqual({
        a: {
          b: ['foo'],
        },
      });
    });
    it('updates existing path (non-empty array at leaf)', () => {
      const object = {
        a: {
          b: ['bar'],
        },
      };
      const path = 'a.b';
      const value = 'foo';

      expect(setSidebarsEntry(object, path, value)).toEqual({
        a: {
          b: ['bar', 'foo'],
        },
      });
    });
    it('throws updating existing path without array at leaf (string)', () => {
      const object = {
        a: {
          b: 'not an array',
        },
      };
      const path = 'a.b';
      const value = 'foo';

      expect(() => {
        setSidebarsEntry(object, path, value);
      }).toThrow();
    });
    it('throws updating existing path without array at leaf (object)', () => {
      const object = {
        a: {
          b: {},
        },
      };
      const path = 'a.b';
      const value = 'foo';

      expect(() => {
        setSidebarsEntry(object, path, value);
      }).toThrow();
    });
    it('adds layers to object (single layer)', () => {
      const object = {
        a: {
          b: [],
        },
      };
      const path = 'a.b.c';
      const value = 'foo';

      expect(setSidebarsEntry(object, path, value)).toEqual({
        a: {
          b: [
            {
              c: ['foo'],
            },
          ],
        },
      });
    });
    it('adds layers to object (multiple layers)', () => {
      const object = {
        a: {
          b: [],
        },
      };
      const path = 'a.b.c.d';
      const value = 'foo';

      expect(setSidebarsEntry(object, path, value)).toEqual({
        a: {
          b: [
            {
              c: [
                {
                  d: ['foo'],
                },
              ],
            },
          ],
        },
      });
    });
    it('updates existing mix of nested objects and arrays', () => {
      const object = {
        a: {
          b: [
            {
              c: {
                // Note d is nested directly under c (not via an array).
                // We should support updating existing structures like
                // this, but not create them like this (instead creating
                // an array inside c, with an object element with d as a key)
                d: ['foo'],
              },
            },
          ],
        },
      };
      const path = 'a.b.c.d';
      const value = 'bar';

      expect(setSidebarsEntry(object, path, value)).toEqual({
        a: {
          b: [
            {
              c: {
                d: ['foo', 'bar'],
              },
            },
          ],
        },
      });
    });
  });
});
