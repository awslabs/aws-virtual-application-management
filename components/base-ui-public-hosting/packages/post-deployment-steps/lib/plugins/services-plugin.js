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
 * A function that registers base services required by the base addon for post-deployment lambda handler
 * @param container An instance of ServicesContainer to register services to
 * @param pluginRegistry A registry that provides plugins registered by various components for the specified extension point.
 *
 * @returns {Promise<void>}
 */
// eslint-disable-next-line no-unused-vars
async function registerServices(container, pluginRegistry) {
  // no new services to register for the post-deployment steps contributed by this component
}

const plugin = {
  // getStaticSettings, // not implemented, the default behavior provided by base is sufficient
  // getLoggingContext, // not implemented, the default behavior provided by base is sufficient
  // getLoggingContext, // not implemented, the default behavior provided by base is sufficient
  // registerSettingsService, // not implemented, the default behavior provided by base is sufficient
  // registerLoggerService, // not implemented, the default behavior provided by base is sufficient
  registerServices,
};

export default plugin;
