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
import { writeFile } from './helpers/file-helper';

const writeI18nFilesPlugin = ({ namespace, outputPath }) => {
  const getTasks = async (existingTasks, assemblyInfo, _slsPlugin, _pluginRegistry) => {
    return [
      ...existingTasks,
      () => {
        const translations = assemblyInfo.i18nAccumulator[namespace].translations;
        const file = path.join(assemblyInfo.targetSolutionDir, outputPath, `translations.json`);
        writeFile(file, JSON.stringify(translations, null, 2));
      },
    ];
  };
  return {
    getTasks,
  };
};

export { writeI18nFilesPlugin };
