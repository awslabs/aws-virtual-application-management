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

// const _ = require('lodash');
// const { getSystemRequestContext } = require('@aws-ee/base-services/lib/helpers/system-context');

const consoleLogger = {
  info(...args) {
    // eslint-disable-next-line no-console
    console.log(...args);
  },
};

module.exports = async function newHandler({ metrics, servicesContainer, settings, log = consoleLogger } = {}) {
  return async (_event, _context) => {
    return Promise.all(
      metrics.map(async plugin => {
        await plugin.generateMetricReports({ servicesContainer, settings, log });
      }),
    );
  };
};
