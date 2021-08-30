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
// import createUser from '@aws-ee/base-services/lib/schema/create-user.json';
// import updateUser from '@aws-ee/base-services/lib/schema/update-user.json';

function getControllerConfigs(controllerConfigsSoFar) {
  const filePath = path.resolve(__dirname, '../**/controllers/*.js');
  const schemas = {
    // createUser,
    // updateUser,
  };
  return [...controllerConfigsSoFar, { filePath, schemas }];
}

async function getConfiguration(configSoFar) {
  const updatedConfig = {
    ...configSoFar,
    controllerConfigs: getControllerConfigs(configSoFar.controllerConfigs),
  };
  return updatedConfig;
}

const plugin = {
  getConfiguration,
};

export default plugin;
