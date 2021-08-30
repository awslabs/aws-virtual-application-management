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

/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const assert = require('assert');
const _ = require('lodash');

/**
 * Returns an array of Jest project configuration objects. This function prepares Jest project configuration objects
 * for all the components so that the solution can then use these Jest project configurations to run the tests for
 * each of these components. This function is mainly used in the solution jest.config.js file to help with preparing
 * the jest project configuration objects.
 *
 * Jest project configuration is documented here https://jestjs.io/docs/configuration#projects-arraystring--projectconfig
 *
 * The solution calling this function (via jest.config.js) can choose to do further transformation to the project
 * configuration. For example, it can add 'testPathIgnorePatterns' to exclude certain tests or it can return undefined
 * from the "transformer" function to indicate that a component tests should not be included.
 *
 * The "transformer" function will be called for each project configuration (one is created per component).
 */
async function getProjectConfigs(jestGlobals, transformer = async (config) => config) {
  assert(jestGlobals, 'jestGlobals is required to be passed to the getProjectConfigs() function');

  const dependencyGraph = _.get(jestGlobals, '__bootstrap__.dependencyGraph', []);
  // dependencyGraph is an array of nodes, this array is already prepared by the bootstrap logic, so
  // we can just loop through it to construct jest project configuration objects.
  // Each item in the dependencyGraph has the following properties:
  // - name: <component name>
  // - testsDir: <full path to the api integration tests folder for the component>
  // - type: <component|framework|solution>

  // Result is the array of the project configurations
  const result = [];

  for (const node of dependencyGraph) {
    const { type, name, testsDir } = node;

    // We don't create a jest project configuration for a node of type 'framework'
    if (type === 'framework') continue;

    // If we don't have testsDir, we don't need to create a project configuration
    if (_.isEmpty(testsDir)) continue;

    const config = {
      displayName: name,
      rootDir: testsDir,
      testEnvironment: 'node',
      testTimeout: 60 * 60 * 1000,
      globals: jestGlobals,
    };

    const transformed = await transformer(config, node);
    // If the transformer returns an empty configuration, it means that we should skip it

    if (_.isEmpty(transformed)) continue;

    result.push(config);
  }

  return result;
}

module.exports = {
  getProjectConfigs,
};
