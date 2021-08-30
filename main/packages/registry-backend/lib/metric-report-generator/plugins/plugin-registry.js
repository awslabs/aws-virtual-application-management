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

const _ = require('lodash');
const baseAuditPlugin = require('@aws-ee/base-services/lib/plugins/audit-plugin');
const baseServicesPlugin = require('@aws-ee/base-api-handler/lib/plugins/services-plugin');
const vamMetricsPlugin = require('@aws-ee/vam-metrics/lib/plugins/metrics-plugin');

const extensionPoints = {
  metrics: [vamMetricsPlugin],
  service: [baseServicesPlugin],
  audit: [baseAuditPlugin],
};

async function getPlugins(extensionPoint) {
  return extensionPoints[extensionPoint];
}

async function getPluginsWithMethod(extensionPoint, methodName) {
  const plugins = await getPlugins(extensionPoint);
  return plugins.filter(ep => _.isFunction(ep[methodName]));
}

const registry = {
  getPlugins,
  getPluginsWithMethod,
};

module.exports = registry;
