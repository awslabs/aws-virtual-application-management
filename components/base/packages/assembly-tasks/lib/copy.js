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
import fs from 'fs-extra';
import chalk from 'chalk';

import { match } from './helpers/match-helper';

async function copy({
  pattern,
  ignorePatterns = ['**/.DS_Store', '**/node_modules/**', '**/.serverless/**', '**/.webpack/**'],
  srcDir,
  targetDir,
  slsPlugin,
}) {
  const copyFiles = async files => {
    slsPlugin.cli.log(
      `copying files: ${chalk.cyan(files)} from: ${chalk.green(srcDir)} into: ${chalk.greenBright(targetDir)}`,
    );
    // eslint-disable-next-line no-restricted-syntax
    for (const file of files) {
      // eslint-disable-next-line no-await-in-loop
      const srcFile = path.join(srcDir, file);
      // eslint-disable-next-line no-await-in-loop
      const stats = await fs.stat(srcFile);

      if (!stats.isDirectory()) {
        const targetFile = path.join(targetDir, file);
        // eslint-disable-next-line no-await-in-loop
        await fs.copy(srcFile, targetFile);
      }
    }
  };

  return async () => copyFiles(await match({ dir: srcDir, pattern, ignorePatterns }));
}

export { copy };
