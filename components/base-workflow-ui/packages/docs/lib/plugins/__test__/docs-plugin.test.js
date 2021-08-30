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

import plugin from '../docs-plugin';

describe('plugin', () => {
  const configSoFar = { pagesPaths: [], staticFilesPaths: [], docusaurusConfig: [], sidebarsConfig: {} };
  describe('getConfiguration', () => {
    it('should get configuration', async () => {
      const updatedConfig = await plugin.getConfiguration(configSoFar);
      expect(updatedConfig).toHaveProperty('pagesPaths');
      expect(updatedConfig).toHaveProperty('staticFilesPaths');
      expect(updatedConfig).toHaveProperty('docusaurusConfig');
      expect(updatedConfig).toHaveProperty('sidebarsConfig');
    });
  });
});
