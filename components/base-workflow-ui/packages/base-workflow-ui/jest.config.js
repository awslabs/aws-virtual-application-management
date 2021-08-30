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

// jest.config.js
module.exports = {
  verbose: true,
  notify: false,
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/setup-tests.js'],
  modulePathIgnorePatterns: ['<rootDir>/dist/'],
  collectCoverageFrom: ['./src/**/*.js', '!**/*.test.js', '!**/*.config.js', '!**/__fixtures__/**', '!/dist/'],
  // testPathIgnorePatterns: ['service.test.js'],
  // Configure JUnit reporter as CodeBuild currently only supports JUnit or Cucumber reports
  // See https://docs.aws.amazon.com/codebuild/latest/userguide/test-reporting.html
  reporters: ['default', ['jest-junit', { suiteName: 'jest tests', outputDirectory: './.build/test' }]],
  collectCoverage: true,
  coverageThreshold: { global: { lines: 40 } },
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  setupFiles: ['./setup-tests.js'],
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': './assetsTransformer.js',
  },
  restoreMocks: true,
};
