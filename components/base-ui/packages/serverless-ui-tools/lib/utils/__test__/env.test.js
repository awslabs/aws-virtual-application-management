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

import _ from 'lodash/fp';
import { itProp, fc } from 'jest-fast-check';
import { toLines } from '../env';

describe('toLines', () => {
  itProp(
    'converts to string ignoring objects',
    [fc.dictionary(fc.string(), fc.string()), fc.object()],
    (dictionary, object) => {
      const joinedTuples = _.keys(dictionary).map(key => `${key}=${dictionary[key]}`);
      const expected = _.join('\n')(joinedTuples);
      dictionary.object = object;
      expect(toLines(dictionary)).toEqual(expected);
    },
  );
});
