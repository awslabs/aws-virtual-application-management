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

import DocsPlugin from '../docs-plugin';
import baseDocusaurusConfig from '../../docs/docusaurus.config';
import sidebarsConfig from '../../docs/sidebars';

describe('docs-plugin', () => {
  it('provides the expected config', async () => {
    const configSoFar = {
      pagesPaths: [],
      staticFilesPaths: [],
      docusaurusConfig: {},
      sidebarsConfig: {},
    };

    const result = await DocsPlugin.getConfiguration(configSoFar);

    expect(result.pagesPaths.every((path) => path.endsWith('/base/packages/docs/lib/docs/pages'))).toBe(true);
    expect(result.staticFilesPaths.every((path) => path.endsWith('/base/packages/docs/lib/docs/static'))).toBe(true);
    expect(result.docusaurusConfig).toEqual(baseDocusaurusConfig);
    expect(result.sidebarsConfig).toEqual(sidebarsConfig);
  });
});
