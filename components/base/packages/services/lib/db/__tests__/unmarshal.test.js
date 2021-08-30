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

/* eslint-disable max-classes-per-file */
import _ from 'lodash';
import { itProp, fc } from 'jest-fast-check';
import unmarshal from '../unmarshal';

const item = {
  simpleProperty: 'testValue',
  setProperty: { wrapperName: 'Set', values: [1, 2, 3] },
};
const expectedResultItem = {
  simpleProperty: 'testValue',
  setProperty: [1, 2, 3],
};

describe('unmarshal', () => {
  it('returns undefined for undefined', () => {
    expect(unmarshal(undefined)).toBeUndefined();
  });

  itProp('returns undefined for empties', fc.anything(), obj => {
    fc.pre(!_.isArray(obj) && _.size(obj) === 0);
    expect(unmarshal(obj)).toBeUndefined();
  });

  itProp('returns whatever is passed in for non-arrays and non-objects', fc.anything(), obj => {
    fc.pre(!_.isArray(obj) && !_.isObject(obj) && _.size(obj) !== 0);
    expect(unmarshal(obj)).toBe(obj);
  });

  itProp('returns whatever is passed in for non-objects (array version)', fc.anything(), obj => {
    fc.pre(!_.isObject(obj));
    expect(unmarshal([obj])).toEqual([obj]);
  });

  it('transforms an item', () => {
    const result = unmarshal(item);
    expect(result).toEqual(expectedResultItem);
  });

  it('transforms an item (array mode)', () => {
    const result = unmarshal([item]);
    expect(result).toEqual([expectedResultItem]);
  });
});
