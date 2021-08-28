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

/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const path = require('path');
const fs = require('fs-extra');

/**
 * Return the full path of each child directory. This function does not go deep,
 * just the direct child directories are returned.
 *
 * @param {string} dir A folder to return all its
 */
async function listDir(dir) {
  const result = [];

  // We first check if the dir exists
  const exists = await fs.pathExists(dir);
  if (!exists) return result;

  const items = await fs.readdir(dir);

  for (const item of items) {
    const possibleDir = path.join(dir, item);
    const stats = await fs.stat(possibleDir);
    if (stats.isDirectory()) result.push(possibleDir);
  }

  return result;
}

module.exports = {
  listDir,
};
