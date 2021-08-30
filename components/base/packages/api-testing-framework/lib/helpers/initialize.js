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
/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const path = require('path');

const { settingsWrapper } = require('../settings/settings');
const { invokeMethodInFile } = require('./invoke-method');

/**
 * For each tests dir, look for support/init.js, if it exists and it exports an init() method,
 * then call this method and pass it (settings, aws and dependencyGraph)
 */
async function initialize({ settings, aws, dependencyGraph }) {
  // For each tests dir, look for support/init.js, if it exists and if it exports an 'init()' function,
  // then call the function and pass it (settings, aws, dependencyGraph)
  for (const node of dependencyGraph) {
    const testsDir = node.testsDir;
    const file = path.join(testsDir, 'support/init.js');

    // invokeMethodInFile knows how to find the file and the method
    await invokeMethodInFile({ file, methodName: 'init' }, async (method) => {
      const source = { name: node.name, file };
      const wrapper = settingsWrapper({ settings, source });

      // Call the init() exported by the init.js file
      return method({ settings: wrapper, aws, dependencyGraph });
    });
  }
}

module.exports = { initialize };
