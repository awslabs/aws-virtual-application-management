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

const fs = require('fs-extra');
const path = require('path');

const { loadYaml } = require('../files/load-yaml');
const { validateMeta } = require('./validate-meta');

/**
 * Loads the component.yml and detects if <dir>/packages/api-integration-tests folder exists
 *
 * The return value is an object of this shape:
 * {
 *   name: '<component name>',
 *   meta: <the content of the component.yaml>,
 *   hasApiTestsDir: true if packages/api-integration-tests folder exists
 *   rootDir: the root path to this component which is the same as the provided 'dir'
 *   apiTestsDir: the path to the packages/api-integration-tests, but only if it exists
 * }
 *
 * @param {string} dir The folder where component.yml is expected
 */
async function loadComponent({ dir }) {
  const componentFile = path.join(dir, 'component.yml');
  const meta = await loadYaml(componentFile);
  await validateMeta({ meta, file: componentFile });

  const testFolder = path.join(dir, 'packages/api-integration-tests');
  const testExists = await fs.pathExists(testFolder); // Note, we are using pathExists not exists, because fs.exists is deprecated

  return {
    name: meta.name,
    meta,
    hasApiTestsDir: testExists,
    rootDir: dir,
    apiTestsDir: testFolder,
  };
}

module.exports = { loadComponent };
