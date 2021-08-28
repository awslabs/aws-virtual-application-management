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

/* eslint-disable no-loop-func */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const path = require('path');

const { invokeMethodInDir } = require('../helpers/invoke-method');
const { Registry, registryWrapper } = require('../helpers/registry');

async function registerResources({ clientSession }) {
  const { dependencyGraph } = clientSession.setup;
  const registry = new Registry();

  // For each tests dir, look under support/resources and register any resource nodes if they export
  // 'registerResources()' function.
  for (const node of dependencyGraph) {
    const testsDir = node.testsDir;
    const dir = path.join(testsDir, 'support/resources');

    // invokeMethodInDir knows how to find the files and the method
    await invokeMethodInDir({ dir, methodName: 'registerResources' }, async (file, method) => {
      const source = { name: node.name, file };
      const wrapper = registryWrapper({ registry, source });

      // Call the registerResources() exported by the js file
      return method({ clientSession, registry: wrapper });
    });
  }

  // At this point, the registry contains all the TOP LEVEL resource node class instances keyed by their names.
  const resources = registry.entries();

  return { registry, resources };
}

module.exports = { registerResources };
