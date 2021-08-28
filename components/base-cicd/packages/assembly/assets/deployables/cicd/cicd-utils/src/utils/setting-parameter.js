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

/**
 * command line that sets the value of a configuration parameter
 */
// eslint-disable-next-line import/no-extraneous-dependencies
const replace = require('replace-in-file');

module.exports = {
  comment(file, parameterName) {
    const regex = new RegExp(`^${parameterName}:`, 'gm');
    const options = {
      files: file,
      from: regex,
      to: `# ${parameterName}:`,
    };

    replace.sync(options);
  },

  uncomment(file, parameterName) {
    const regex = new RegExp(`^# ${parameterName}:`, 'gm');
    const options = {
      files: file,
      from: regex,
      to: `${parameterName}:`,
    };

    replace.sync(options);
  },
};

// eslint-disable-next-line import/no-extraneous-dependencies
require('make-runnable');
