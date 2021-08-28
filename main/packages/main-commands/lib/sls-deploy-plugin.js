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
 * A function to perform any additional logic when "pnpx solution-deploy" command is invoked
 * @param slsPlugin Reference to the Serverless Framework Plugin object containing the "serverless" and "options" objects
 *
 * @param pluginRegistry A registry that provides plugins registered by various components for the specified extension point.
 *
 * @returns {Promise<void>}
 */
// eslint-disable-next-line no-unused-vars
async function deploy(slsPlugin, pluginRegistry) {
  // perform any additional logic here ..
  // You can access settings as follows
  // const settings = slsPlugin.serverless.service.custom.settings;
}

const plugin = {
  deploy,
};

export default plugin;
