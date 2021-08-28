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

const _ = require('lodash');
const path = require('path');
const parse = require('yargs-parser');

const { sortComponents, getSolutionRootDir } = require('./components/sort');
const errors = require('./errors/error-messages');
const { loadYaml } = require('./files/load-yaml');
const { Settings } = require('./settings/settings');
const { initAws } = require('./aws/init-aws');
const { initialize } = require('./helpers/initialize');

/**
 * The entry point to the bootstrap process for the api testing framework and to initialize the tests run.
 *
 * @param {string} dir The full path to the 'api-integration-tests' folder. If the scope = 'component', then the dir
 *                 should be pointing to the component's own api-integration-tests folder.
 *                 if the scope = 'solution', then dir should be pointing to the solution's api-integration-tests
 *                 folder.
 * @param {string} stageFilePath The full path to the stage file (should NOT include the file name itself)
 * @param {string} scope Either 'component' or 'solution'. If the tests run is for a specific component, then the
 *                 scope should be 'component' otherwise it should be 'solution'.
 */
async function bootstrap({ dir, stageFilePath, scope } = {}) {
  const parsedArgs = parse(process.argv);

  // Get the stage argument either from the command line args or from the process environment variables
  const stage = parsedArgs.stage || parsedArgs.s || process.env.STAGE;
  if (_.isEmpty(stage)) throw errors.noStage();

  // dir is required
  if (_.isEmpty(dir)) throw errors.dirNotProvided();

  // stage path is required
  if (_.isEmpty(stageFilePath)) throw errors.stagePathNotProvided();

  // scope is required
  if (_.isEmpty(scope)) throw errors.scopeNotProvided();

  // scope can either be 'component' or 'solution
  if (!['component', 'solution'].includes(scope)) throw errors.invalidScope(scope);

  // 'dir' points to api-integration-tests folder, so we need to go up twice to get to the root folder
  // for a component, it will be <component> folder, for the solution it will the <solution> top folder
  const rootDir = path.join(dir, '../..');
  const dependencyGraph = await sortComponents({ dir: rootDir, scope });

  // This runId is generated per integration tests run, this helps us identify a specific run
  const runId = `${Date.now()}`;

  // Load the settings file
  const settingsFile = path.join(stageFilePath, `${stage}.yml`);
  const settingsFromFile = await loadYaml(settingsFile);
  const solutionRootDir = getSolutionRootDir({ dir: rootDir, scope });
  const settings = new Settings();

  settings.merge(settingsFromFile, { name: 'solution', file: settingsFile });

  // We add a few more settings that are needed
  settings.merge(
    {
      runId,
      runDir: dir,
      solutionRootDir,
    },
    { name: 'framework', file: __filename },
  );

  const aws = await initAws({ settings, dependencyGraph });

  // For any component (including the framework and the solution) that exports support/init.js,
  // give it a chance to initialize
  await initialize({ settings, aws, dependencyGraph });

  // Return the initialization result
  return {
    globals: {
      __bootstrap__: {
        dependencyGraph,
        settingsMemento: settings.getMemento(),
      },
    },
  };
}

module.exports = { bootstrap };
