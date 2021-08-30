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

/* eslint-disable no-restricted-syntax */
/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
const _ = require('lodash');
const path = require('path');
const toposort = require('toposort');

const { chopLeft } = require('../helpers/string');
const { listDir } = require('../files/list-dir');
const { loadComponent } = require('./load-component');

/**
 * Sorts components based on their dependencies and returns an array of the result. The array has the following shape:
 *
 * [ { name: <component name>, testsDir: <api-integration-tests folder>, type: 'component/solution' }, { .. } ]
 *
 * The order of the array is important as it represents the topological sorting. The first component does not
 * depend on any other components, while the second component might depend on the first component, etc.
 *
 * @param {string} dir The root folder for the component that we want to use as the starting point or if the scope
 *                     is solution, then the root folder fo the solution
 * @param {array<string>} skip A list of component names to skip while constructing the dependency tree
 * @param {string} scope Can be either component or solution
 */
async function sortComponents({ dir, skip = [], scope }) {
  const processQueue = [];
  // key is the component name, value is api-integration-tests folder path
  const componentsMap = {};
  // Edges that represent dependencies, see https://github.com/marcelklehr/toposort
  const edges = [];
  // The folder where we list all the components (name 'components')
  const componentsRoot = getComponentsRootDir({ dir, scope });
  // The root folder for the whole solution
  const solutionRoot = getSolutionRootDir({ dir, scope });

  const isSolution = scope === 'solution';

  if (isSolution) {
    processQueue.push(...(await listDir(componentsRoot)));
  } else {
    processQueue.push(dir);
  }

  do {
    const itemDir = processQueue.shift();
    const component = await loadComponent({ dir: itemDir });
    const name = component.name;

    // If the component name is found in the skip array, then we don't process it at all.
    if (skip.includes(name)) continue;
    componentsMap[name] = component;
    const dependencies = component.meta.dependencies || [];

    // Loop through each dependency
    _.forEach(dependencies, (dependency) => {
      if (skip.includes(dependency)) return;

      const componentDir = path.join(componentsRoot, chopLeft(dependency, 'ee-component-'));
      processQueue.push(componentDir);
      edges.push([name, dependency]);
    });
  } while (!_.isEmpty(processQueue));

  // We use the toposort library to do the topological sorting
  const sorted = toposort(edges).reverse();

  const result = [];
  _.forEach(sorted, (name) => {
    const component = componentsMap[name];
    if (_.isEmpty(component)) return;
    if (component.hasApiTestsDir) result.push({ name, testsDir: component.apiTestsDir, type: 'component' });
  });

  // If the scope = solution, we need to insert the solution api-integration-test folder as part of the returned result
  if (isSolution) {
    result.push({
      name: 'solution',
      testsDir: path.join(solutionRoot, 'main/api-integration-tests'),
      type: 'solution',
    });
  }

  // Lets add the framework to the dependency graph so that it can contribute its own aws services, etc.
  result.unshift({
    name: 'framework',
    testsDir: path.join(solutionRoot, 'components/base/packages/api-testing-framework'),
    type: 'framework',
  });

  return result;
}

function getComponentsRootDir({ dir, scope }) {
  // If scope = component then dir should be pointing to the <component> folder
  // if scope = solution then dir should be pointing to the solution root folder

  // For the case of a component, components root is one level up
  if (scope === 'component') return path.join(dir, '..');

  // For the case of the solution, components root is the child folder 'components'
  return path.join(dir, 'components');
}

function getSolutionRootDir({ dir, scope }) {
  // If scope = component then dir should be pointing to the <component> folder
  // if scope = solution then dir should be pointing to the solution root folder

  // For the case of a component, solution root is two levels up
  if (scope === 'component') return path.join(dir, '../..');

  // For the case of the solution, solution root is the same as dir
  return dir;
}

module.exports = { sortComponents, getSolutionRootDir };
