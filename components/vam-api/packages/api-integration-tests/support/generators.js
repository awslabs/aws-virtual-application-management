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

async function registerGenerators({ setup, registry }) {
  const runId = setup.settings.get('runId');
  const string = ({ prefix = 'test', suffix = '', length = 6 } = {}) =>
    `${prefix}-${runId}-${chance.string({ alpha: true, casing: 'lower', length })}${suffix}`;

  const generators = {
    imageName: ({ prefix = 'testimage' } = {}) => string({ prefix }),
    fleetName: ({ prefix = 'testimage', suffix = '-testfleet' } = {}) => string({ prefix, suffix }),
    dynamicCatalogName: ({ prefix = 'testfleet', suffix = '-catalog' } = {}) => string({ prefix, suffix }),
    groupName: ({ prefix = 'group' } = {}) => string({ prefix }),
  };

  registry.merge(generators);
}

module.exports = { registerGenerators };
