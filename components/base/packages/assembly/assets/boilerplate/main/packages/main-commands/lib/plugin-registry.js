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

import _ from 'lodash';
import path from 'path';

import slsCommandsPlugin from './sls-commands-plugin';
import slsPackagePlugin from './sls-package-plugin';
import slsDeployPlugin from './sls-deploy-plugin';
import slsInfoPlugin from './sls-info-plugin';
import slsRemovePlugin from './sls-remove-plugin';

/**
 * Provides plugin registry that is used by the root level "@aws-ee/base-serverless-solution-commands".
 * Serverless Framework plugin to add additional root level Serverless Framework commands and/or hooks.
 *
 * @param projectRootDir Full path to the project root directory.
 * @param componentsDir Full path to the components directory that contains various components of the solution.
 * @param targetSolutionDir Full path of the generated solution directory where all the deployable units are placed by assembling assets from various components during "solution-assemble".
 * @param cliInput The command line input given to the Serverless Framework CLI as an array. This includes the Serverless Framework command being executed.
 * @param logger An instance of "components/base/packages/serverless-solution-commands/lib/command-logger.js" class.
 * @returns {{getPlugins: function(extensionPoint: string): *}}
 */
// eslint-disable-next-line no-unused-vars
const getPluginRegistry = ({ projectRootDir, componentsDir, targetSolutionDir, cliInput, logger }) => {
  let missingPlugins;
  // eslint-disable-next-line no-unused-vars
  const markMissingPlugin = (fullModulePath, err) => {
    logger.error(`Unable to load ${fullModulePath}.`);
    missingPlugins = true;
  };

  const lazyRequireIfExists = (modulePath, fnMissing) => () => {
    // The targetSolutionDir points to the full path of the ".generated-solution" dir
    const fullModulePath = path.join(targetSolutionDir, modulePath);
    try {
      // eslint-disable-next-line import/no-dynamic-require,global-require
      return require(fullModulePath);
    } catch (err) {
      if (_.isFunction(fnMissing)) fnMissing(fullModulePath, err);
    }
    return {};
  };
  const lazyRequire = modulePath => lazyRequireIfExists(modulePath, markMissingPlugin);

  const customDomainsPackagePlugin = lazyRequire('custom-domains/scripts/plugins/sls-package-plugin.js');
  const customDomainsDeployPlugin = lazyRequire('custom-domains/scripts/plugins/sls-deploy-plugin.js');
  const customDomainsRemovePlugin = lazyRequire('custom-domains/scripts/plugins/sls-remove-plugin.js');

  const docsPackagePlugin = lazyRequire('docs/scripts/plugins/sls-package-plugin.js');
  const docsDeployPlugin = lazyRequire('docs/scripts/plugins/sls-deploy-plugin.js');

  function getPlugins(extensionPoint) {
    missingPlugins = false;
    const plugins = getPluginsInternal(extensionPoint);
    if (missingPlugins) {
      logger.error('This can happen if you did not run "pnpx sls solution-assemble" before.');
      throw new Error('Some expected plugins were missing!');
    }
    return plugins;
  }
  function getPluginsInternal(extensionPoint) {
    switch (extensionPoint) {
      case 'commands':
        return [slsCommandsPlugin];
      case 'package':
        return [customDomainsPackagePlugin(), docsPackagePlugin(), slsPackagePlugin];
      case 'deploy':
        return [customDomainsDeployPlugin(), docsDeployPlugin(), slsDeployPlugin];
      case 'info':
        return [slsInfoPlugin];
      case 'remove':
        return [customDomainsRemovePlugin(), slsRemovePlugin];
      default:
        return [];
    }
  }

  const registry = {
    getPlugins,
  };

  return registry;
};

export { getPluginRegistry };
