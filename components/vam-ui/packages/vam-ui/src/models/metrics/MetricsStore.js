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
import { types } from 'mobx-state-tree';
import { BaseStore } from '@aws-ee/base-ui/dist/models/BaseStore';

import { getMetrics } from '../../helpers/api';
import Metric from './Metric';

const MetricsStore = BaseStore.named('MetricsStore')
  .props({
    metrics: types.optional(types.map(Metric), {}),
    tickPeriod: 60 * 60 * 1000, // 1 hour
  })
  .actions(self => {
    return {
      async doLoad() {
        const metrics = await getMetrics();
        self.runInAction(() => {
          const map = {};
          Object.keys(metrics).forEach(key => {
            map[key] = Metric.create(metrics[key]);
          });
          self.metrics.replace(map);
        });
      },
    };
  })
  .views(self => ({
    getById(id) {
      const metric = self.metrics.get(id);
      return metric || Metric.emptyMetric();
    },

    getAverageSessionData() {
      const prevMonthAvg = self.getById('AverageSessionLengthPreviousMonth');
      const currMonthAvg = self.getById('AverageSessionLengthCurrentMonth');
      const prevMap = _valuesToMapByIndex(prevMonthAvg.values, 0, 1, v => parseInt(v, 10));
      const currMap = _valuesToMapByIndex(currMonthAvg.values, 0, 1, v => parseInt(v, 10));
      const labels = _getUniqueValuesAtIndex([prevMonthAvg.values, currMonthAvg.values]);
      const [previousDataPoints, currentDataPoints] = _dataPointsForLabels(labels, [prevMap, currMap], 0);
      return { labels, previousDataPoints, currentDataPoints };
    },

    getNumberOfSessionsData() {
      const prevMonthSessions = self.getById('DailySessionsPreviousMonth');
      const currentMonthSessions = self.getById('DailySessionsCurrentMonth');
      const prevMap = _valuesToMapByIndex(prevMonthSessions.values, 0, 1, v => parseInt(v, 10));
      const currMap = _valuesToMapByIndex(currentMonthSessions.values, 0, 1, v => parseInt(v, 10));
      // Find the union of dates.
      // Sometimes the previous month may be empty due to no usage on day, sometimes the current month will be empty (as the day may not have even passed yet)
      const labels = _getUniqueValuesAtIndex([prevMonthSessions.values, currentMonthSessions.values]);
      const [previousDataPoints, currentDataPoints] = _dataPointsForLabels(labels, [prevMap, currMap], 0);
      return { labels, previousDataPoints, currentDataPoints };
    },
  }));

function _getUniqueValuesAtIndex(input, index = 0) {
  return _.uniq(
    _.union(
      ...input.map(inp => {
        return inp.map(v => v[index]);
      }),
    ),
  );
}

function _valuesToMapByIndex(values, keyIndex, valueIndex, parseMethod) {
  const map = {};
  values.forEach(v => {
    const val = v[valueIndex];
    map[v[keyIndex]] = parseMethod ? parseMethod(val) : val;
  });
  return map;
}

function _dataPointsForLabels(labels, dataMaps, defaultValue) {
  return dataMaps.map(dataMap => {
    return labels.map(label => {
      return dataMap[label] || defaultValue;
    });
  });
}

function registerContextItems(appContext) {
  appContext.metricsStore = MetricsStore.create({}, appContext);
}

export { MetricsStore, registerContextItems };
