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
import _ from 'lodash/fp';
import {
  addQueryParams,
  childrenArrayToMap,
  chopRight,
  consolidateToMap,
  flattenObject,
  generateId,
  getFragmentParam,
  getOptionsFromRules,
  getQueryParam,
  isAbsoluteUrl,
  isFloat,
  mapToArray,
  niceNumber,
  nicePrice,
  parseError,
  plural,
  removeFragmentParams,
  removeNulls,
  removeQueryParams,
  storage,
  swallowError,
  toUTCDate,
  unFlattenObject,
  validRegions,
} from '../utils';

describe('helpers/utils', () => {
  const neq = _.compose(_.negate, _.eq);
  const toMap = object => new Map(Object.entries(object));
  const property = 'property';
  const getMap = () =>
    toMap({
      a: {
        [property]: 1,
      },
      b: {
        [property]: 2,
      },
      c: {
        [property]: 3,
      },
      d: {
        [property]: 4,
      },
    });

  describe('mapToArray', () => {
    it('returns an array containing map values', () => {
      const map = getMap();
      expect(mapToArray(map)).toEqual(Array.from(map.values()));
    });
    it('is idempotent', () => {
      const map = getMap();
      mapToArray(map);
      expect(map).toEqual(getMap());
    });
  });

  describe('parseError', () => {
    it('maps parameter to Error', () => {
      const object = {
        message: 'message',
        code: 'code',
        status: 'status',
        requestId: 'requestId',
      };
      const err = parseError(object);
      expect(err).toBeInstanceOf(Error);
      expect(err).toMatchObject(object);
    });
  });

  describe('swallowError', () => {
    it('returns a Promise resolved', () => {
      const object = {
        message: 'message',
        code: 'code',
        status: 'status',
        requestId: 'requestId',
      };
      const promise = new Promise(() => object);
      expect(swallowError(promise)).toMatchObject(promise);
    });
    it('returns a thrown Error resolved', async () => {
      const error = new Error();
      const promise = new Promise(() => {
        throw error;
      });
      await expect(swallowError(promise, _.identity)).resolves.toMatchObject(error);
    });
  });

  describe('getOptionsFromRules', () => {
    itProp('returns options from rules', fc.array(fc.string()), inRules => {
      expect(getOptionsFromRules([{ in: inRules }])).toMatchObject(
        inRules.map(a => {
          return {
            key: a,
            text: a,
            value: a,
          };
        }),
      );
    });
  });

  describe('niceNumber', () => {
    it.each`
      string        | expected
      ${undefined}  | ${'N/A'}
      ${''}         | ${'N/A'}
      ${'10000.23'} | ${'10,000'}
    `('formats $string as $expected', ({ string, expected }) => {
      expect(niceNumber(string)).toBe(expected);
    });
  });

  describe('nicePrice', () => {
    it.each`
      string        | expected
      ${undefined}  | ${'N/A'}
      ${''}         | ${'N/A'}
      ${'10000.23'} | ${'10,000.23'}
    `('formats $string as $expected', ({ string, expected }) => {
      expect(nicePrice(string)).toBe(expected);
    });
  });

  describe('plural', () => {
    it.each`
      singleStr             | pluralStr              | count | expected
      ${'governor-general'} | ${'governors-general'} | ${1}  | ${'governor-general'}
      ${'governor-general'} | ${'governors-general'} | ${2}  | ${'governors-general'}
    `('formats $count $singleStr as $expected', ({ singleStr, pluralStr, count, expected }) => {
      expect(plural(singleStr, pluralStr, count)).toBe(expected);
    });
  });

  describe('URL', () => {
    const baseUrl = 'https://foo.bar';
    const key = 'key';
    const removeKey = 'removeKey';
    const value = 'value';
    const baseUrlWithHash = `${baseUrl}#${key}=${value}`;

    describe('getQueryParam', () => {
      it('returns the specified query parameter value', () => {
        expect(getQueryParam(new URL(`${baseUrl}?${key}=${value}`), key)).toBe(value);
      });
    });

    describe('addQueryParam', () => {
      it('adds the params map to a URL without params', () => {
        const queryObject = {
          a: 1,
          b: 2,
        };
        const queryString = _.compose(_.join('&'), _.map(_.join('=')), _.entries)(queryObject);
        expect(addQueryParams(new URL(baseUrl), queryObject).toString()).toMatch(`${baseUrl}/?${queryString}`);
      });
    });

    describe('removeQueryParams', () => {
      it('removes the specified query parameter', () => {
        const url = `${baseUrl}/?key=value`;
        expect(removeQueryParams(new URL(`${url}&${removeKey}=foo`), [removeKey]).toString()).toMatch(url);
      });
    });

    describe('getFragmentParam', () => {
      it('returns the specified hash parameter from a URL string', () => {
        expect(getFragmentParam(baseUrlWithHash, key)).toMatch(value);
      });
      it('returns the specified hash parameter from a URL object', () => {
        expect(getFragmentParam(new URL(baseUrlWithHash), key)).toMatch(value);
      });
    });

    describe('removeFragmentParams', () => {
      it('removes the specified hash parameter from a URL string where others remain', () => {
        expect(removeFragmentParams(new URL(`${baseUrlWithHash}&${removeKey}=foo`), [removeKey])).toBe(baseUrlWithHash);
      });
      it('removes the specified hash parameter from a URL string where no others remain', () => {
        expect(removeFragmentParams(new URL(baseUrlWithHash), [key])).toBe(baseUrl);
      });
    });

    describe('isAbsoluteUrl', () => {
      it('identifies an absolute url', () => {
        expect(isAbsoluteUrl(baseUrl)).toBe(true);
      });
      it('identifies a relative url', () => {
        expect(isAbsoluteUrl('foo/bar')).toBe(false);
      });
    });
  });

  describe('flattenObject --- is working fine if,', () => {
    it('it leaves already flat object of key/value pairs as is', () => {
      const input = { someKey: 'someValue' };
      const expectedOutput = { someKey: 'someValue' };
      const output = flattenObject(input);

      expect(output).toEqual(expectedOutput);
    });
    it('it flattens a simple object graph into a flat object with key/value pairs', () => {
      const input = { someKey: { someNestedKey: 'someValue' } };
      const expectedOutput = { 'someKey.someNestedKey': 'someValue' };
      const output = flattenObject(input);

      expect(output).toEqual(expectedOutput);
    });
    it('it flattens an object graph with arrays correctly', () => {
      const input = { someKey: ['someValue1', 'someValue2'] };
      const expectedOutput = { 'someKey[0]': 'someValue1', 'someKey[1]': 'someValue2' };
      const output = flattenObject(input);

      expect(output).toEqual(expectedOutput);
    });
    it('it flattens an object graph with nested arrays correctly', () => {
      const input = { someKey: ['someValue1', ['someValue2', 'someValue3'], 'someValue4'] };
      const expectedOutput = {
        'someKey[0]': 'someValue1',
        'someKey[1][0]': 'someValue2',
        'someKey[1][1]': 'someValue3',
        'someKey[2]': 'someValue4',
      };
      const output = flattenObject(input);

      expect(output).toEqual(expectedOutput);
    });
    it('it flattens an object graph with arrays containing nested object graphs correctly', () => {
      const input = { someKey: [{ someNestedKey: 'someValue', nestedArr: [1, 2, { nestedArrKey: 'value' }] }] };
      const expectedOutput = {
        'someKey[0].someNestedKey': 'someValue',
        'someKey[0].nestedArr[0]': 1,
        'someKey[0].nestedArr[1]': 2,
        'someKey[0].nestedArr[2].nestedArrKey': 'value',
      };
      const output = flattenObject(input);

      expect(output).toEqual(expectedOutput);
    });
  });
  describe('unFlattenObject --- is working fine if it a correct inverse of the flattenObject, it is correct inverse if', () => {
    it('it leaves object with keys without any delimiters as is', () => {
      const expectedOutput = { someKey: 'someValue' };
      const input = flattenObject(expectedOutput);
      const output = unFlattenObject(input);

      expect(output).toEqual(expectedOutput);
    });
    it('it unFlattens a simple object graph into from a flat object with key/value pairs', () => {
      const expectedOutput = { someKey: { someNestedKey: 'someValue' } };
      const input = flattenObject(expectedOutput);
      const output = unFlattenObject(input);

      expect(output).toEqual(expectedOutput);
    });
    it('it unFlattens to an object graph with arrays correctly', () => {
      const expectedOutput = { someKey: ['someValue1', 'someValue2', 'someValue3'] };
      const input = flattenObject(expectedOutput);
      const output = unFlattenObject(input);

      expect(output).toEqual(expectedOutput);
    });
    it('it unFlattens to an object graph with nested arrays correctly', () => {
      const expectedOutput = { someKey: ['someValue1', ['someValue2', 'someValue3'], 'someValue4'] };
      const input = flattenObject(expectedOutput);
      // input = { "someKey_0": "someValue1", "someKey_1_0": "someValue2", "someKey_1_1": "someValue3", "someKey_2": "someValue4" };
      const output = unFlattenObject(input);

      expect(output).toEqual(expectedOutput);
    });
    it('it unFlattens to an object graph with arrays containing nested object graphs correctly', () => {
      const expectedOutput = {
        someKey: [{ someNestedKey: 'someValue', nestedArr: [1, 2, { nestedArrKey: 'value' }] }],
      };
      const input = flattenObject(expectedOutput);
      // input = { 'someKey[0].someNestedKey': 'someValue', 'someKey[0].nestedArr[0]': 1, 'someKey[0].nestedArr[1]': 2, 'someKey[0].nestedArr[2].nestedArrKey': 'value' };
      const output = unFlattenObject(input);

      expect(output).toEqual(expectedOutput);
    });
  });
  describe('consolidateToMap', () => {
    const mergeExistingFn = (object, value) => {
      object[property] = value[property];
    };
    const itemsArray = [
      { id: 'b', [property]: 22 },
      { id: 'd', [property]: 44 },
      { id: 'e', [property]: 66 },
    ];
    const expectedShouldAppendFalse = {
      b: {
        [property]: 22,
      },
      d: {
        [property]: 44,
      },
      e: {
        id: 'e',
        [property]: 66,
      },
    };
    it('merges/adds array members in/not in in map & removes map members not in array when shouldAppend is false', () => {
      const map = getMap();
      consolidateToMap(map, itemsArray, mergeExistingFn);
      expect(map).toEqual(toMap(expectedShouldAppendFalse));
    });
    it('does not remove map members not in array when shouldAppend', () => {
      const map = getMap();
      consolidateToMap(map, itemsArray, mergeExistingFn, 'id', true);
      expect(map).toEqual(
        toMap({
          ...expectedShouldAppendFalse,
          a: {
            [property]: 1,
          },
          c: {
            [property]: 3,
          },
        }),
      );
    });
  });

  describe('removeNulls', () => {
    it('returns undefined as empty', () => {
      expect(removeNulls(undefined)).toEqual({});
    });
    it('removes only null properties', () => {
      const objectWithNulls = {
        a: 1,
        b: null,
        c: 3,
      };
      expect(removeNulls(objectWithNulls)).toEqual({ a: 1, c: 3 });
    });
  });

  describe('chopRight', () => {
    itProp(
      'removes second parameter from end of first iff it exists',
      [fc.string(), fc.string()],
      (a, b) => chopRight(a + b, b) === a,
    );
  });

  describe('isFloat', () => {
    itProp('returns true iff parameter is float', fc.double({ min: 0.1 }), isFloat);
    itProp('returns true iff parameter is integer', fc.integer(), _.negate(isFloat));
  });

  describe('childrenArrayToMap', () => {
    it('returns an object containing first keys of parameter array mapped to values', () => {
      expect(
        childrenArrayToMap([
          {
            x: 1,
            y: 2,
          },
          {
            z: 'a',
          },
        ]),
      ).toEqual({ x: 1, z: 'a' });
    });
  });

  describe('generateId', () => {
    itProp('returns an ID in correct format', fc.lorem(), a => new RegExp(/.*_\d+_\d+?_\d+?$/).test(generateId(a)));
    itProp('returns a different ID each time it is called', fc.lorem(), a => neq(generateId(a))(generateId(a)));
  });

  describe('toUTCDate', () => {
    itProp(
      'returns non-strings and strings ending with Z unchanged',
      fc.object({
        arbitraries: [fc.boolean(), fc.integer(), fc.double(), fc.string().filter(_.endsWith('Z')), null, undefined],
      }),
      a => toUTCDate(a) === a,
    );
    itProp(
      'returns non-empty strings with Z appended if this does not already exist',
      fc.string({ minLength: 1 }).filter(_.negate(_.endsWith('Z'))),
      a => toUTCDate(a) === `${a}Z`,
    );
  });

  describe('validRegions', () => {
    it('returns correct regions sorted', () => {
      expect(validRegions()).toEqual([
        'ap-east-1',
        'ap-northeast-1',
        'ap-northeast-2',
        'ap-northeast-3',
        'ap-south-1',
        'ap-southeast-1',
        'ap-southeast-2',
        'ca-central-1',
        'cn-north-1',
        'cn-northwest-1',
        'eu-central-1',
        'eu-north-1',
        'eu-west-1',
        'eu-west-2',
        'eu-west-3',
        'me-south-1',
        'sa-east-1',
        'us-east-1',
        'us-east-2',
        'us-gov-east-1',
        'us-gov-west-1',
        'us-west-1',
        'us-west-2',
      ]);
    });
  });

  describe('storage', () => {
    const getMockStorage = () => {
      return { getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn(), clear: jest.fn() };
    };
    const initialiseLogAndStorage = () => {
      global.console.log = jest.fn();
      global.localStorage = undefined;
      global.window = undefined;
      global.sessionStorage = undefined;
    };
    const assertStorage = (storageToMock, key, value) => {
      initialiseLogAndStorage();
      const mockStorage = getMockStorage();
      switch (storageToMock) {
        case 'localStorage':
          global.localStorage = mockStorage;
          break;
        case 'window.localStorage':
          global.window = {
            localStorage: mockStorage,
          };
          break;
        case 'sessionStorage':
          global.sessionStorage = mockStorage;
          break;
        default:
          global.window = {
            sessionStorage: mockStorage,
          };
      }

      storage.setItem(key, value);
      storage.getItem(key);
      storage.removeItem(key);
      storage.clear();

      expect(mockStorage.setItem).toHaveBeenCalledWith(key, value);
      expect(mockStorage.getItem).toHaveBeenCalledWith(key);
      expect(mockStorage.removeItem).toHaveBeenCalledWith(key);
      expect(mockStorage.clear).toHaveBeenCalledTimes(1);
    };

    itProp('defaults to localStorage', [fc.anything(), fc.anything()], (key, value) => {
      assertStorage('localStorage', key, value);
    });

    itProp(
      'defaults to window.localStorage when localStorage is unavailable',
      [fc.anything(), fc.anything()],
      (key, value) => {
        assertStorage('window.localStorage', key, value);
      },
    );

    itProp(
      'defaults to sessionStorage when localStorage does not exist in any form',
      [fc.anything(), fc.anything()],
      (key, value) => {
        assertStorage('sessionStorage', key, value);
      },
    );

    itProp('defaults to window.sessionStorage as last resort', [fc.anything(), fc.anything()], (key, value) => {
      assertStorage('window.sessionStorage', key, value);
    });

    itProp('returns void and logs when no storage is available', [fc.anything(), fc.anything()], (key, value) => {
      initialiseLogAndStorage();
      expect(storage.setItem(key, value)).toBeUndefined();
      expect(storage.getItem(key)).toBeUndefined();
      expect(storage.removeItem(key)).toBeUndefined();
      expect(storage.clear()).toBeUndefined();
      expect(global.console.log).toHaveBeenCalled();
    }); //
  });
});
