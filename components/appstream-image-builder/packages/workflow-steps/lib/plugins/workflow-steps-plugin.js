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

import prepareImageBuilderEnvironment from '../steps/prepare-image-builder-environment/prepare-image-builder-environment-logic';
import prepareImageBuilderEnvironmentDef from '../steps/prepare-image-builder-environment/prepare-image-builder-environment-definition';

import launchImageBuilder from '../steps/launch-image-builder/launch-image-builder-logic';
import launchImageBuilderDef from '../steps/launch-image-builder/launch-image-builder-definition';

import installViaChoco from '../steps/install-via-choco/install-via-choco-logic';
import installViaChocoDef from '../steps/install-via-choco/install-via-choco-definition';

import installViaPowershell from '../steps/install-via-powershell/install-via-powershell-logic';
import installViaPowershellDef from '../steps/install-via-powershell/install-via-powershell-definition';

import installDynamicCatalogScript from '../steps/install-dynamic-catalog-script/install-dynamic-catalog-script-logic';
import installDynamicCatalogScriptDef from '../steps/install-dynamic-catalog-script/install-dynamic-catalog-script-definition';

import waitForImageBuilder from '../steps/wait-for-image-builder/wait-for-image-builder-logic';
import waitForImageBuilderDef from '../steps/wait-for-image-builder/wait-for-image-builder-definition';

import cleanup from '../steps/cleanup/cleanup-logic';
import cleanupDef from '../steps/cleanup/cleanup-definition';

const add = (implClass, definition) => ({ implClass, definition });

// The order is important, add your steps here
const steps = [
  add(prepareImageBuilderEnvironment, prepareImageBuilderEnvironmentDef),
  add(launchImageBuilder, launchImageBuilderDef),
  add(installViaChoco, installViaChocoDef),
  add(installViaPowershell, installViaPowershellDef),
  add(installDynamicCatalogScript, installDynamicCatalogScriptDef),
  add(waitForImageBuilder, waitForImageBuilderDef),
  add(cleanup, cleanupDef),
];

async function registerWorkflowSteps(registry) {
  // eslint-disable-next-line no-restricted-syntax
  for (const step of steps) {
    const { implClass, definition } = step;
    await registry.add({ implClass, definition }); // eslint-disable-line no-await-in-loop
  }
}

export default { registerWorkflowSteps };
