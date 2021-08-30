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

/* eslint-disable global-require */
import noOpLogic from './no-op/no-op-logic';
import noOpDefinition from './no-op/no-op-definition';
import obtainWriteLockLogic from './obtain-write-lock/obtain-write-lock-logic';
import obtainWriteLockDefinition from './obtain-write-lock/obtain-write-lock-definition';
import releaseWriteLockLogic from './release-write-lock/release-write-lock-logic';
import releaseWriteLockDefinition from './release-write-lock/release-write-lock-definition';

const add = (implClass, definition) => ({ implClass, definition });

// The order is important, add your steps here
const steps = [
  add(noOpLogic, noOpDefinition),
  add(obtainWriteLockLogic, obtainWriteLockDefinition),
  add(releaseWriteLockLogic, releaseWriteLockDefinition),
];

async function registerWorkflowSteps(registry) {
  // eslint-disable-next-line no-restricted-syntax
  for (const step of steps) {
    const { implClass, definition } = step;
    await registry.add({ implClass, definition }); // eslint-disable-line no-await-in-loop
  }
}

export default { registerWorkflowSteps };
