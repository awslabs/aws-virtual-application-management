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
/* eslint-disable no-continue */
/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */
/* eslint-disable no-restricted-syntax */
const _ = require('lodash');
const fs = require('fs-extra');

const { listFiles, listFilesDeep } = require('../files/list-files');

/**
 * Find all the js files in a folder and if they export the provided method name then call the callback function.
 * The callback function receives the file and the bounded method.
 */
async function invokeMethodInDir({ dir, methodName, deep = true }, callback) {
  // We find all the js files in the provided folder
  let files = [];
  if (deep) {
    files = await listFilesDeep(dir, (file) => _.endsWith(file, '.js'));
  } else {
    files = await listFiles(dir, (file) => _.endsWith(file, '.js'));
  }

  for (const file of files) {
    const content = require(file) || {};
    if (!_.isFunction(content[methodName])) continue;
    await callback(file, content[methodName].bind(content));
  }
}

/**
 * Find the provided method name in the given file (if the file exists and if the method exists) then call the
 * callback function. The callback function receives the bounded method.
 */
async function invokeMethodInFile({ file, methodName }, callback) {
  const exists = await fs.pathExists(file);

  if (!exists) return;

  const content = require(file) || {};
  if (!_.isFunction(content[methodName])) return;
  await callback(content[methodName].bind(content));
}

module.exports = { invokeMethodInFile, invokeMethodInDir };
