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
const _ = require('lodash');
const path = require('path');
const fs = require('fs-extra');

/**
 * Return the full path of each child file. This function does not go deep,
 * just the direct child files are returned.
 *
 * @param {string} dir A folder to return all its files
 */
async function listFiles(dir, filter = () => true) {
  const result = [];

  // We first check if the dir exists
  const exists = await fs.pathExists(dir);
  if (!exists) return result;

  const items = await fs.readdir(dir);

  for (const item of items) {
    const possibleFile = path.join(dir, item);
    const stats = await fs.stat(possibleFile);
    if (stats.isFile() && filter(possibleFile)) result.push(possibleFile);
  }

  return result;
}

/**
 * Return the full path of each child file. This function will go into child directories.
 *
 * @param {string} dir A folder to return all its files and all the child files in all child directories,
 * as deep as there are child directories;
 */
async function listFilesDeep(dir, filter = () => true) {
  const result = [];
  const queue = [];

  // We first check if the dir exists
  const exists = await fs.pathExists(dir);
  if (!exists) return result;

  let items = await fs.readdir(dir);
  let entries = createEntries(dir, items);
  if (!_.isEmpty(entries)) queue.push(...entries);

  while (!_.isEmpty(queue)) {
    const { parentDir, childPath } = queue.shift();
    const possibleFile = path.join(parentDir, childPath);
    const stats = await fs.stat(possibleFile);
    if (stats.isFile() && filter(possibleFile)) {
      result.push(possibleFile);
    } else if (stats.isDirectory()) {
      items = await fs.readdir(possibleFile);
      entries = createEntries(possibleFile, items);
      if (!_.isEmpty(entries)) queue.push(...entries);
    }
  }

  return result;
}

function createEntries(parentDir, childPaths) {
  return _.map(childPaths, (childPath) => ({ parentDir, childPath }));
}

module.exports = {
  listFiles,
  listFilesDeep,
};
