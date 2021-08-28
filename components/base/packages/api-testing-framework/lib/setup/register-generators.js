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

/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const path = require('path');

const { invokeMethodInFile } = require('../helpers/invoke-method');
const { Registry, registryWrapper } = require('../helpers/registry');

/**
 * For each tests dir, look for support/generators.js, if it exists and it exports registerGenerators() function,
 * then call the function.
 *
 * Returns the populated registry and the generators.  The generators is a map of generator names and generator
 * functions.
 *
 * IMPORTANT: these generators have nothing to do with the ES6 generators.
 *
 * The generators here are simply helper functions that return values that we can use in the tests, for example,
 * generating user names, etc.
 */
async function registerGenerators({ setup }) {
  const { dependencyGraph } = setup;
  const registry = new Registry();
  // For each tests dir, look for support/generators.js, if it exists and if it exports
  // registerGenerators () function, then call the function
  for (const node of dependencyGraph) {
    const testsDir = node.testsDir;
    const file = path.join(testsDir, 'support/generators.js');

    // invokeMethodInFile knows how to find the file and the method
    await invokeMethodInFile({ file, methodName: 'registerGenerators' }, async (method) => {
      const source = { name: node.name, file };
      const wrapper = registryWrapper({ registry, source });

      // Call the registerGenerators() exported by the generators.js file
      return method({ setup, registry: wrapper });
    });
  }

  const generators = registry.entries();

  return { registry, generators };
}

module.exports = { registerGenerators };
