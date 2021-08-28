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

function wrapAssemblyPlugins(assemblyPlugins) {
  const getTasks = async (existingTasks, assemblyInfo, slsPlugin, pluginRegistry) => {
    let tasks = existingTasks;
    // eslint-disable-next-line no-restricted-syntax
    for (const plugin of assemblyPlugins) {
      // eslint-disable-next-line no-await-in-loop
      tasks = await plugin.getTasks(tasks, assemblyInfo, slsPlugin, pluginRegistry);
    }
    return tasks;
  };

  return {
    getTasks,
  };
}

export { wrapAssemblyPlugins };
