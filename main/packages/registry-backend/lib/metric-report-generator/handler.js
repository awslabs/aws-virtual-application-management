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

const ServicesContainer = require('@aws-ee/base-services-container/lib/services-container');
const { registerServices } = require('@aws-ee/base-services/lib/utils/services-registration-util');

const newHandler = require('./handler-impl');
const pluginRegistry = require('./plugins/plugin-registry');

const initHandler = (async () => {
  const servicesContainer = new ServicesContainer(['settings', 'log']);
  await registerServices(servicesContainer, pluginRegistry);
  await servicesContainer.initServices();
  const log = await servicesContainer.find('log');
  const metrics = await pluginRegistry.getPluginsWithMethod('metrics', 'generateMetricReports');
  const settings = await servicesContainer.find('settings');
  return newHandler({ log, metrics, settings, servicesContainer });
})();

// eslint-disable-next-line import/prefer-default-export
module.exports.handler = async (...args) => {
  return (await initHandler)(...args);
};
