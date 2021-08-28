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

import _ from 'lodash';
import { Service } from '@aws-ee/base-services-container';

const MetricsAuthzService = require('./metrics-authz-service');

const settingKeys = {
  metricsBucket: 'metricsBucket',
};

class MetricsService extends Service {
  constructor() {
    super();
    this.dependency(['aws', 'authorizationService', 'metricsAuthzService']);
  }

  async init() {
    super.init();
    const [metricsAuthzService] = await this.service(['metricsAuthzService']);

    // A private authorization condition function that just delegates to the environmentAuthzService
    this._allowAuthorized = (requestContext, { resource, action, effect, reason }, ...args) =>
      metricsAuthzService.authorize(requestContext, { resource, action, effect, reason }, ...args);
  }

  async loadMetrics(requestContext) {
    await this.assertAuthorized(requestContext, { action: MetricsAuthzService.LIST_METRICS }, {});
    const aws = await this.service('aws');
    const s3 = new aws.sdk.S3({ signatureVersion: 'v4' });
    const metricsBucket = this.settings.get(settingKeys.metricsBucket);

    const metrics = [
      {
        name: 'AverageSessionLengthCurrentMonth',
        parser: this.csvMultipleValues,
      },
      {
        name: 'AverageSessionLengthPreviousMonth',
        parser: this.csvMultipleValues,
      },
      {
        name: 'DailySessionsCurrentMonth',
        parser: this.csvMultipleValues,
      },
      {
        name: 'DailySessionsPreviousMonth',
        parser: this.csvMultipleValues,
      },
    ];

    const rawResults = await Promise.all(
      metrics.map(metric => {
        return this.loadMetric(requestContext, s3, { metricsBucket, metric });
      }),
    );

    const results = rawResults
      .filter(r => r !== null)
      .reduce((accum, val) => {
        return { ...accum, [val.name]: val.content };
      }, {});
    return results;
  }

  async loadMetric(_requestContext, s3, { metricsBucket, metric }) {
    const results = await this.listMetricResults(_requestContext, s3, { metricsBucket, metric });

    const dataObject = results
      .filter(o => o.Key.substr(o.Key.length - 4) === '.csv')
      .sort((a, b) => {
        return b.LastModified.getTime() - a.LastModified.getTime();
      })[0];

    if (!dataObject) {
      return null;
    }
    const raw = await s3
      .getObject({
        Bucket: metricsBucket,
        Key: dataObject.Key,
      })
      .promise();
    let content = Buffer.from(raw.Body).toString('utf8');
    if (metric.parser) {
      try {
        content = metric.parser(content);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Error parsing result for metric: ', metric.name);
        content = null;
      }
    }

    return {
      name: metric.name,
      content,
    };
  }

  async listMetricResults(_requestContext, s3, { metricsBucket, metric }) {
    const today = new Date();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return [
      ...(await this.listMetricsForDate(_requestContext, s3, { date: today, metricsBucket, metric })),
      ...(await this.listMetricsForDate(_requestContext, s3, { date: yesterday, metricsBucket, metric })),
    ];
  }

  async listMetricsForDate(_requestContext, s3, { date, metricsBucket, metric }) {
    const res = await s3
      .listObjectsV2({
        Bucket: metricsBucket,
        Prefix: `${metric.name}/${date.toISOString().substr(0, 10)}`,
      })
      .promise();
    return res.Contents;
  }

  csvSingleValues(content) {
    const lines = content.split('\n');
    const headers = lines[0].split(',');
    const values = lines[1].split(',');

    const result = headers.reduce((accum, h, i) => {
      h = _.trim(h, '"');
      const v = _.trim(values[i], '"');
      return { ...accum, [h]: v };
    }, {});
    return result;
  }

  csvMultipleValues(content) {
    const lines = content.split('\n');
    const headers = lines
      .shift()
      .split(',')
      .map(h => _.trim(h, '"'));

    const values = lines
      .filter(line => line !== '')
      .map(line => {
        return line.split(',').map(v => {
          return _.trim(v, '"');
        });
      });

    return { headers, values };
  }

  async assertAuthorized(requestContext, { action }, ...args) {
    const authorizationService = await this.service('authorizationService');
    const conditions = [this._allowAuthorized];

    // The "authorizationService.assertAuthorized" below will evaluate permissions by calling the "conditions" functions first
    // It will then give a chance to all registered plugins (if any) to perform their authorization.
    // The plugins can even override the authorization decision returned by the conditions
    // See "authorizationService.authorize" method for more details
    await authorizationService.assertAuthorized(
      requestContext,
      { extensionPoint: 'metrics-authz', action, conditions },
      ...args,
    );
  }
}

export default MetricsService;
