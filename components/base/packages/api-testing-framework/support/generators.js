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

const chance = require('chance').Chance();

const passwordGenerator = require('generate-password');

/**
 * In many scenarios during the tests, we need to generate different values. These generators make this
 * process easier. When possible 'runId' is added to the values returned. 'runId' is unique for each run
 * of the integration tests, this means that all resources that are created, by the same run, will be
 * identified via the runId.
 */
async function registerGenerators({ setup, registry }) {
  const runId = setup.settings.get('runId');
  const string = ({ prefix = 'test', suffix = '', length = 6 } = {}) =>
    `${prefix}-${runId}-${chance.string({ alpha: true, casing: 'lower', length })}${suffix}`;

  const generators = {
    string,
    username: ({ tagPrefix = 'test' } = {}) =>
      string({ prefix: `success+${tagPrefix}`, suffix: '@simulator.amazonses.com' }),
    password: () => passwordGenerator.generate({ length: 20, numbers: true, symbols: true, strict: true }),
    firstName: () => `TestUser${chance.first({ nationality: 'en' })}`,
    lastName: () => `TestUser${chance.last({ nationality: 'en' })}`,
    description: () => `Resource automatically created by SWB integration test - ${runId}`,
    accountId: () => chance.string({ length: 12, pool: '123456789012' }), // aws account ids are always 12 digits
    vpcId: () => `vpc-${chance.string({ length: 17, pool: '1234567890abcdef' })}`,
    subnetId: () => `subnet-${chance.string({ length: 17, pool: '1234567890abcdef' })}`,
    kmsKeyArn: () => `arn:aws:kms:${chance.string()}`, // doesn't actually conform to ARN spec, passes DI schema validation tho
    integer: (thresholds = {}) => chance.integer({ min: 0, max: 50000, ...thresholds }),
  };

  registry.merge(generators);
}

module.exports = { registerGenerators };
