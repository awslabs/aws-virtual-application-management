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
 * For each tests dir, look for support/defaults.js, if it exists and it exports registerDefaults() function,
 * then call the function.
 *
 * Returns the populated registry and the defaults.  The defaults is a map of names and values.
 */
async function registerDefaults({ setup }) {
  const { dependencyGraph } = setup;
  const registry = new Registry();
  // For each tests dir, look for support/defaults.js, if it exists and if it exports
  // registerDefaults () function, then call the function
  for (const node of dependencyGraph) {
    const testsDir = node.testsDir;
    const file = path.join(testsDir, 'support/defaults.js');

    // invokeMethodInFile knows how to find the file and the method
    await invokeMethodInFile({ file, methodName: 'registerDefaults' }, async (method) => {
      const source = { name: node.name, file };
      const wrapper = registryWrapper({ registry, source });

      // Call the registerDefaults() exported by the defaults.js file
      return method({ setup, registry: wrapper });
    });
  }

  const defaults = registry.entries();

  return { registry, defaults };
}

module.exports = { registerDefaults };
