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

import path from 'path';

/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
import { getSlsCommandPlugin, getSlsRemovePlugin } from '@aws-ee/base-script-utils';

const slsProjDir = path.normalize(path.join(__dirname, '../../'));

const slsRemovePlugin = getSlsRemovePlugin(slsProjDir);
const invokePlugin = getSlsCommandPlugin({
  slsProjDir,
  pluginMethodName: 'invoke',
  slsSubCommand: 'invoke',
  additionalArgs: ['-f', 'postDeployment', '--data', JSON.stringify({ action: 'remove' })],
});

async function remove(slsPlugin, pluginRegistry) {
  slsPlugin.cli.warn('--- Removing Post-Deployment ... \n\n');
  // Invoke post-deployment lambda with action = "remove" to un-deploy all resources previously deployed by post-deployment
  await invokePlugin.invoke(slsPlugin, pluginRegistry);
  await slsRemovePlugin.remove(slsPlugin, pluginRegistry);
  slsPlugin.cli.warn('--- Successfully removed Post-Deployment ---\n\n');
}

const plugin = {
  remove,
};

export default plugin;
