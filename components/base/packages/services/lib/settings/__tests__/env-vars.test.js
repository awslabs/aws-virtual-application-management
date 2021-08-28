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
import { extract } from '../env-vars';

describe('env-vars', () => {
  describe('extract', () => {
    itProp(
      'returns object containing all environment variables with specified prefix',
      [fc.dictionary(fc.lorem(), fc.string()), fc.lorem()],
      (dictionary, prefix) => {
        _.keys(dictionary).forEach(key => {
          process.env[`${prefix}${key}`] = dictionary[key];
        });
        const extracted = extract(prefix);
        _.keys(dictionary).forEach(key => {
          expect(_.get(_.camelCase(key))(extracted)).toEqual(dictionary[key]);
        });
      },
    );
  });
});
