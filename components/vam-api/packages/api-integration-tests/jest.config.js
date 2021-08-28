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

const path = require('path');
const _ = require('lodash');
const { bootstrap } = require('@aws-ee/api-testing-framework');

// jest.config.js
const initOnce = _.once(bootstrap);

module.exports = async () => {
  const initResult = await initOnce({
    dir: __dirname,
    stageFilePath: path.join(__dirname, '../../../../main/api-integration-tests/config/settings'),
    scope: 'component',
  });

  return {
    rootDir: __dirname,
    verbose: true,
    notify: false,
    testEnvironment: 'node',
    modulePathIgnorePatterns: ['<rootDir>/dist/'],
    collectCoverageFrom: [
      '../vam-services/lib/**/*.js',
      '!**/*.test.js',
      '!**/*.config.js',
      '!**/__fixtures__/**',
      '!/dist/',
    ],
    coverageThreshold: {},
    testPathIgnorePatterns: ['/node_modules/', '/.history/', '/__tests__/__fixtures__/', '/dist/'],
    // Configure JUnit reporter as CodeBuild currently only supports JUnit or Cucumber reports
    // See https://docs.aws.amazon.com/codebuild/latest/userguide/test-reporting.html
    reporters: [
      'default',
      ['jest-junit', { suiteName: 'VAM API integration tests', outputDirectory: './.build/test' }],
    ],
    globals: initResult.globals,
    testTimeout: 60 * 60 * 1000,
  };
};
