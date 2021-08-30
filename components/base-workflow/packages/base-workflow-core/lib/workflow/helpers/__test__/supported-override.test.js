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
  workflowPropsSupportedOverrideKeys,
  stepPropsSupportedOverrideKeys,
  workflowPropsSupportedOverrideKeysTransformer,
  stepPropsSupportedOverrideKeysTransformer,
} from '../supported-override';

describe('SupportedOverride', () => {
  describe('validate override', () => {
    it('should valid workflowPropsSupportedOverrideKeys', () => {
      expect(workflowPropsSupportedOverrideKeys).toEqual([
        'title',
        'desc',
        'instanceTtl',
        'runSpecSize',
        'runSpecTarget',
        'steps',
      ]);
    });

    it('should valid stepPropsSupportedOverrideKeys', () => {
      expect(stepPropsSupportedOverrideKeys).toEqual(['title', 'desc', 'skippable']);
    });

    it('should valid workflowPropsSupportedOverrideKeysTransformer with runSpecSize key', () => {
      const result = workflowPropsSupportedOverrideKeysTransformer('runSpecSize');
      expect(result).toEqual('runSpec.size');
    });

    it('should valid workflowPropsSupportedOverrideKeysTransformer with runSpecTarget key', () => {
      const result = workflowPropsSupportedOverrideKeysTransformer('runSpecTarget');
      expect(result).toEqual('runSpec.target');
    });

    it('should valid stepPropsSupportedOverrideKeysTransformer', () => {
      const result = stepPropsSupportedOverrideKeysTransformer('test-custom-key');
      expect(result).toEqual('test-custom-key');
    });
  });
});
