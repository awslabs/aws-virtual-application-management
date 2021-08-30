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
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

import { match } from './helpers/match-helper';
import { writeFile } from './helpers/file-helper';

async function mergeFiles({
  from,
  to,
  ignorePatterns = ['**/.DS_Store', '**/node_modules/**', '**/.serverless/**', '**/.webpack/**'],
  mergeFn = _.merge,
  parser,
  slsPlugin,
}) {
  const srcDir = from.dir;
  const targetDir = to.dir;
  const mergeFilesFn = async ({ srcFiles }) => {
    await Promise.all(
      _.map(srcFiles, async srcFileRelativePath => {
        const srcFile = path.normalize(path.join(srcDir, srcFileRelativePath));
        const srcFileContent = await fs.readFile(srcFile);

        const targetFile = path.normalize(path.join(targetDir, srcFileRelativePath));
        const targetExists = await fs.pathExists(targetFile);

        if (targetExists) {
          slsPlugin.cli.log(`\nMerging \n from: "${chalk.cyan(srcFile)}" \n to: "${chalk.cyan(targetFile)}"`);

          const targetObj = await parser.unmarshal(await fs.readFile(targetFile));
          const srcObj = await parser.unmarshal(srcFileContent);
          const resultYml = await parser.marshal(mergeFn(targetObj, srcObj));
          await writeFile(targetFile, resultYml);
        } else {
          slsPlugin.cli.log(`\n"${chalk.cyan(targetFile)}" does not exist. Copying "${chalk.cyan(srcFile)}" as is.`);
          await fs.copy(srcFile, targetFile);
        }
      }),
    );
  };

  return async () => {
    const srcFiles = await match({ ...from, ignorePatterns });
    slsPlugin.cli.log(
      `\nMerging the following files \n from dir: ${chalk.cyan(from.dir)} \n to dir: ${chalk.cyan(
        to.dir,
      )}\n${chalk.green(_.join(srcFiles, '\n'))}`,
    );

    return mergeFilesFn({ srcFiles });
  };
}

export { mergeFiles };
