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
import { getSlsCommandPlugin } from '@aws-ee/base-script-utils';

const slsProjDir = path.normalize(path.join(__dirname, '../../'));
const localPackagePlugin = getSlsCommandPlugin({
  slsProjDir,
  pluginMethodName: 'prepareDeploy',
  slsSubCommand: 'package-ui',
  additionalArgs: ['--local=true'],
});
const nonLocalPackagePlugin = getSlsCommandPlugin({
  slsProjDir,
  pluginMethodName: 'prepareDeploy',
  slsSubCommand: 'package-ui',
});

const plugin = {
  prepareDeploy: async (slsPlugin, pluginRegistry) => {
    await localPackagePlugin.prepareDeploy(slsPlugin, pluginRegistry);
    await nonLocalPackagePlugin.prepareDeploy(slsPlugin, pluginRegistry);
  },
};

export default plugin;
