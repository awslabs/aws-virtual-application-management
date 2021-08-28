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

import ConfigOverrideOption from '../props-override-option';

describe('PropsOverrideOption', () => {
  let configOverrideOption;

  describe('violatedProps', () => {
    it('should get empty violated configs with steps', async () => {
      // BUILD
      const overrideOption = {
        allowed: ['allowedKey1', 'steps'],
      };
      const supportedKeys = ['allowedKey1', 'allowedKey2', 'allowedKey3', 'allowedKey4'];
      const transformer = key => key;
      configOverrideOption = new ConfigOverrideOption(overrideOption, supportedKeys, transformer);
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
      const result = configOverrideOption.violatedProps(overridingConfig, srcConfig);

      // CHECK
      expect(result).toStrictEqual([]);
    });

    it('should get empty violated configs without steps', async () => {
      // BUILD
      const overrideOption = {
        allowed: ['allowedKey1'],
      };
      const supportedKeys = ['allowedKey1', 'allowedKey2', 'allowedKey3', 'allowedKey4'];
      configOverrideOption = new ConfigOverrideOption(overrideOption, supportedKeys);
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
      const result = configOverrideOption.violatedProps(overridingConfig, srcConfig);

      // CHECK
      expect(result).toStrictEqual([]);
    });

    it('should get violated configs without steps', async () => {
      // BUILD
      const overrideOption = {
        allowed: ['allowedKey1'],
      };
      const supportedKeys = ['allowedKey1', 'allowedKey2', 'allowedKey3', 'allowedKey4'];
      configOverrideOption = new ConfigOverrideOption(overrideOption, supportedKeys);
      const overridingConfig = {
        allowedKey1: 'allowedVal1',
        allowedKey2: 'allowedVal2',
        allowedKey3: 'allowedVal3',
        allowedKey4: 'allowedVal4',
        notAllowedKey1: 'notAllowedVal1',
        notAllowedKey2: 'notAllowedVal2-notmatch',
      };
      const srcConfig = {
        allowedKey1: 'allowedVal1',
        allowedKey2: 'allowedVal2',
        allowedKey3: 'allowedVal3',
        allowedKey4: 'allowedVal4-notmatch',
        notAllowedKey1: 'notAllowedVal1',
        notAllowedKey2: 'notAllowedVal2',
      };

      // OPERATE
      const result = configOverrideOption.violatedProps(overridingConfig, srcConfig);

      // CHECK
      expect(result).toStrictEqual(['allowedKey4']);
    });
  });
});
