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

import path from 'path';
import { copy } from './copy';

function getCopyDirTaskPlugin({
  srcDir,
  targetDir = '',
  pattern = '**/*',
  ignorePatterns = ['**/.DS_Store', '**/node_modules/**', '**/.serverless/**', '**/.webpack/**'],
}) {
  // eslint-disable-next-line no-unused-vars
  const getTasks = async (existingTasks, assemblyInfo, slsPlugin, pluginRegistry) => {
    const { targetSolutionDir } = assemblyInfo;
    const dirName = path.basename(srcDir);
    const tasks = [
      ...existingTasks,

      await copy({
        pattern,
        ignorePatterns,
        srcDir,
        targetDir: path.normalize(path.join(targetSolutionDir, targetDir, dirName)),
        slsPlugin,
      }),
    ];
    return tasks;
  };
  return {
    getTasks,
  };
}

// eslint-disable-next-line import/prefer-default-export
export { getCopyDirTaskPlugin };
