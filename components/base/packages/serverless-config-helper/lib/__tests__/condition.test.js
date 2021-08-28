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

import { evalCondition } from '../condition';

describe('condition eval', () => {
  const vals3 = [
    ['a', 'a', 'b'],
    [3, 3, 5],
    [false, true, true],
  ];

  function doTest2(fn, a, b, relation, expected) {
    it(`evaluates '${fn}' when ${typeof a}s are ${relation}`, async () => {
      const result = evalCondition(`\${${fn}('${a}', '${b}')}`);
      expect(result).toEqual(expected);
    });
  }
  vals3.forEach(([lo, loAlt, hi]) => {
    doTest2('eq', lo, loAlt, 'equal', lo === loAlt);
    doTest2('eq', lo, hi, 'different', lo === hi);

    doTest2('neq', lo, loAlt, 'equal', lo !== loAlt);
    doTest2('neq', lo, hi, 'different', lo !== hi);

    doTest2('lt', lo, hi, 'less', lo < hi);
    doTest2('lt', lo, loAlt, 'equal', lo < loAlt);
    doTest2('lt', hi, lo, 'greater', hi < lo);

    doTest2('le', lo, hi, 'less', lo <= hi);
    doTest2('le', lo, loAlt, 'equal', lo <= loAlt);
    doTest2('le', hi, lo, 'greater', hi <= lo);

    doTest2('ge', lo, hi, 'less', lo >= hi);
    doTest2('ge', lo, loAlt, 'equal', lo >= loAlt);
    doTest2('ge', hi, lo, 'greater', hi >= lo);

    doTest2('gt', lo, hi, 'less', lo > hi);
    doTest2('gt', lo, loAlt, 'equal', lo > loAlt);
    doTest2('gt', hi, lo, 'greater', hi > lo);
  });

  function test1(fn, a, expected) {
    it(`evaluates '${fn}' when ${typeof a} is ${a}`, async () => {
      const result = evalCondition(`\${${fn}(${a})}`);
      expect(result).toEqual(expected);
    });
  }
  [[false, true]].forEach(([lo, hi]) => {
    test1('identity', lo, lo);
    test1('identity', hi, hi);
    test1('not', lo, hi);
    test1('not', hi, lo);
  });

  function test2b(fn, a, b, expected) {
    it(`evaluates '${fn}' when ${typeof a}s are [${a},${b}]`, async () => {
      const result = evalCondition(`\${${fn}(${a},${b})}`);
      expect(result).toEqual(expected);
    });
  }
  [
    [false, false],
    [false, true],
    [true, false],
    [true, true],
  ].forEach(([a, b]) => {
    test2b('and', a, b, a && b);
    test2b('or', a, b, a || b);
  });
});
