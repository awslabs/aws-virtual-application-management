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

import path from 'path';
import _ from 'lodash';
import sidebarsConfig from '../docs/sidebars';

function getPagesPaths(pagesPathsSoFar) {
  // Solution-specific page contributions should be registered here
  return [...pagesPathsSoFar, path.resolve(__dirname, '../docs/pages')];
}

function getStaticFilesPaths(staticFilesPathsSoFar) {
  // Solution-specific static file contributions should be registered here
  return [...staticFilesPathsSoFar, path.resolve(__dirname, '../docs/static')];
}

function getDocusaurusConfig(docusaurusConfigSoFar) {
  return {
    // Solution-specific configuration overrides go here
    ...docusaurusConfigSoFar,
    baseUrl: '/docs/',
  };
}

function getSidebarsConfig(sidebarsConfigSoFar) {
  return _.merge(sidebarsConfigSoFar, sidebarsConfig);
}

async function getConfiguration(configSoFar) {
  const updatedConfig = {
    ...configSoFar,
    pagesPaths: getPagesPaths(configSoFar.pagesPaths),
    staticFilesPaths: getStaticFilesPaths(configSoFar.staticFilesPaths),
    docusaurusConfig: getDocusaurusConfig(configSoFar.docusaurusConfig),
    sidebarsConfig: getSidebarsConfig(configSoFar.sidebarsConfig),
  };
  return updatedConfig;
}

const plugin = {
  getConfiguration,
};

export default plugin;
