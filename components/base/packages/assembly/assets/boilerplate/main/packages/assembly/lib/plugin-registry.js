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

import baseAssemblyPlugin from '@aws-ee/base-assembly';
import mainAssemblyPlugin from './assembly-plugin';

/**
 * Provides plugin registry that is used by the root level "@aws-ee/base-serverless-solution-commands".
 * Serverless Framework plugin to add additional root level Serverless Framework commands and/or hooks.
 *
 * @param projectRootDir Full path to the project root directory
 * @param componentsDir Full path to the components directory that contains various components of the solution
 * @param targetSolutionDir Full path of the generated solution directory where all the deployable units are placed by assembling assets from various components during "solution-assemble"
 * @param cliInput The command line input given to the Serverless Framework CLI as an array. This includes the Serverless Framework command being executed.
 * @param logger An instance of "components/base/packages/serverless-solution-commands/lib/command-logger.js" class
 * @returns {{getPlugins: function(extensionPoint:string): *}}
 */
// eslint-disable-next-line no-unused-vars
const getPluginRegistry = ({ projectRootDir, componentsDir, targetSolutionDir, cliInput, logger }) => {
  const extensionPoints = {
    assemble: [baseAssemblyPlugin, mainAssemblyPlugin],
  };

  function getPlugins(extensionPoint) {
    return extensionPoints[extensionPoint];
  }

  const registry = {
    getPlugins,
  };

  return registry;
};

export { getPluginRegistry };
