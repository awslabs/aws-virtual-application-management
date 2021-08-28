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

import _ from 'lodash';
import { itProp, fc } from 'jest-fast-check';
import plugin from '../docs-plugin';

describe('plugin.getConfiguration', () => {
  itProp(
    'return configSoFar mutated so that each property is a superset of its original value',
    fc.record({
      pagesPaths: fc.array(fc.object()),
      staticFilesPaths: fc.array(fc.object()),
      docusaurusConfig: fc.object(),
      sidebarsConfig: fc.object(),
      controllerConfigs: fc.array(fc.object()),
    }),
    async (configSoFar) => {
      const config = await plugin.getConfiguration(configSoFar);
      _.map(['pagesPaths', 'staticFilesPaths', 'controllerConfigs'], (property) =>
        expect(_.get(config, property)).toEqual(expect.arrayContaining(_.get(configSoFar, property))),
      );
      _.map(['docusaurusConfig', 'sidebarsConfig'], (property) =>
        expect(_.get(config, property)).toMatchObject(_.get(configSoFar, property)),
      );
    },
  );
});
