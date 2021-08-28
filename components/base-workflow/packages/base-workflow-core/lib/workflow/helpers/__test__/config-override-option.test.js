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

import ConfigOverrideOption from '../config-override-option';

describe('ConfigOverrideOption', () => {
  let configOverrideOption;

  describe('violatedConfigs', () => {
    it('should get violated configs', async () => {
      // BUILD
      const overrideOption = {
        allowed: ['allowedKey1', 'allowedKey2', 'allowedKey3', 'allowedKey4'],
      };
      configOverrideOption = new ConfigOverrideOption(overrideOption);
      const overridingConfig = {
        allowedKey1: 'allowedVal1',
        allowedKey2: 'allowedVal2',
        allowedKey3: 'allowedVal3',
        notAllowedKey1: 'notAllowedVal1',
        notAllowedKey2: 'notAllowedVal2-notmatch',
      };
      const srcConfig = {
        allowedKey1: 'allowedVal1',
        allowedKey2: 'allowedVal2',
        allowedKey3: 'allowedVal3',
        notAllowedKey1: 'notAllowedVal1',
        notAllowedKey2: 'notAllowedVal2',
      };

      // OPERATE
      const result = configOverrideOption.violatedConfigs(overridingConfig, srcConfig);

      // CHECK
      expect(result).toStrictEqual(['notAllowedKey2']);
    });

    it('should get correct result with empty overrideOption', async () => {
      // BUILD
      const overrideOption = {
        allowed: [],
      };
      configOverrideOption = new ConfigOverrideOption(overrideOption);
      const overridingConfig = {
        allowedKey1: 'allowedVal1',
        allowedKey2: 'allowedVal2',
        allowedKey3: 'allowedVal3',
        notAllowedKey1: 'notAllowedVal1',
        notAllowedKey2: 'notAllowedVal2-notmatch',
      };
      const srcConfig = {
        allowedKey1: 'allowedVal1',
        allowedKey2: 'allowedVal2',
        allowedKey3: 'allowedVal3',
        notAllowedKey1: 'notAllowedVal1',
        notAllowedKey2: 'notAllowedVal2',
      };

      // OPERATE
      const result = configOverrideOption.violatedConfigs(overridingConfig, srcConfig);

      // CHECK
      expect(result).toStrictEqual(['notAllowedKey2']);
    });

    it('should get empty result with same srcConfig and overridingConfig', async () => {
      // BUILD
      const overrideOption = {
        allowed: [],
      };
      configOverrideOption = new ConfigOverrideOption(overrideOption);
      const overridingConfig = {
        allowedKey1: 'allowedVal1',
        allowedKey2: 'allowedVal2',
        allowedKey3: 'allowedVal3',
        notAllowedKey1: 'notAllowedVal1',
        notAllowedKey2: 'notAllowedVal2',
      };
      const srcConfig = {
        allowedKey1: 'allowedVal1',
        allowedKey2: 'allowedVal2',
        allowedKey3: 'allowedVal3',
        notAllowedKey1: 'notAllowedVal1',
        notAllowedKey2: 'notAllowedVal2',
      };

      // OPERATE
      const result = configOverrideOption.violatedConfigs(overridingConfig, srcConfig);

      // CHECK
      expect(result).toStrictEqual([]);
    });
  });
});
