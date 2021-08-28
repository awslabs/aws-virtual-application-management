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

const fs = require('fs-extra');
const yaml = require('js-yaml');

const errors = require('../errors/error-messages');

async function loadYaml(file) {
  const exists = await fs.pathExists(file); // Note, we are using pathExists not exists, because fs.exists is deprecated

  if (!exists) throw errors.fileNotFound(file);

  let raw;

  try {
    raw = await fs.readFile(file, 'utf8');
  } catch (error) {
    throw errors.cannotReadFile(file, error.message).cause(error);
  }

  let content;
  try {
    content = yaml.load(raw);
  } catch (error) {
    throw errors.notValidYaml(file, error.message).cause(error);
  }

  return content;
}

module.exports = { loadYaml };
