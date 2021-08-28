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

/**
 * A function to contribute key/value pair entries to the "info" Map. The "info" Map is printed as a table when you invoke
 * "pnpx sls solution-info" command or after "pnpx sls solution-deploy" command.
 *
 * @param existingInfo An "info" Map containing entries for various variables added by previous plugins.
 * It is an instance of JavaScript Map so you can call the regular Map methods such as "set", "get", "has" etc.
 * The Map contains key/value pairs. The values in the Map are Plain JavaScript Objects having the following shape:
 * {
 *  value: // Some variable value
 *  title: // Title for variable entry. This will be displayed in the output.
 *  display: true|false // A flag indicating if this variable should be displayed when printing the output table.
 * }
 *
 * @param slsPlugin Reference to the Serverless Framework Plugin object containing the "serverless" and "options" objects
 * @param pluginRegistry A registry that provides plugins registered by various components for the specified extension point.
 *
 * @returns {Promise<*>} New "info" Map containing additional variables.
 */
// eslint-disable-next-line no-unused-vars
async function getInfo(existingInfo, slsPlugin, pluginRegistry) {
  const settings = slsPlugin.serverless.service.custom.settings;

  const { envName, solutionName } = settings;

  const info = new Map([
    ...existingInfo,

    // Append other info variables here
    ['envName', { value: envName, title: 'Environment Name', display: true }],
    ['solutionName', { value: solutionName, title: 'Solution Name', display: true }],
  ]);
  return info;
}

const plugin = {
  info: getInfo,
};

export default plugin;
