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

const _ = require('lodash');

const errors = require('../errors/error-messages');

/**
 * Examines the meta information (the content of a component.yml) and ensures that certain expected
 * values are in place and in the correct format.
 */
async function validateMeta({ meta = {}, file }) {
  const name = meta.name;
  const dependencies = meta.dependencies || [];

  validateName({ name, file });
  _.forEach(dependencies, (dependency) => {
    if (!_.isString(dependency)) {
      throw errors.dependencyMustBeString(name, dependency, file);
    }
    validateName({ name: dependency, file });
  });
}

function validateName({ name, file }) {
  // check name does not start with @ee-aws
  if (_.startsWith(name, '@aws-ee')) {
    throw errors.invalidCmpName(name, 'It can not start with @aws-ee because a component is not an npm package', file);
  }

  // check name starts with ee-component-
  if (!_.startsWith(name, 'ee-component-')) {
    throw errors.invalidCmpName(name, 'It must start with ee-component-', file);
  }
}

module.exports = { validateMeta };
