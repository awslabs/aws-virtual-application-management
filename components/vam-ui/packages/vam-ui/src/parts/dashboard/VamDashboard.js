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

import React from 'react';
import { inject, observer } from 'mobx-react';
import { withRouter } from 'react-router-dom';
import { Header } from 'semantic-ui-react';
import i18n from 'roddeh-i18n';
import DetailsPage from '@aws-ee/base-ui/dist/parts/helpers/DetailsPage';
import { Bar } from 'react-chartjs-2';
import keys from '../../../../vam-ui-i18n/dist';

// eslint-disable-next-line react/prefer-stateless-function
class VamDashboard extends DetailsPage {
  getStore() {
    return this.props.metricsStore;
  }

  getIconType() {
    return 'area graph';
  }

  getDocumentationUrl() {
    return 'user_guide/sidebar/common/dashboard/introduction';
  }

  renderTitle() {
    return (
      <Header as="h1" color="grey" className="mt3">
        {i18n(keys.METRICS_DASHBOARD)}
      </Header>
    );
  }

  renderMain() {
    return (
      <>
        {this.renderTitle()}
        {this.renderAverageGraph()}
        {this.renderSessionGraph()}
      </>
    );
  }

  renderAverageGraph() {
    const store = this.getStore();

    const { labels, previousDataPoints, currentDataPoints } = store.getAverageSessionData();

    const data = {
      labels,
      datasets: [
        {
          label: i18n(keys.PREVIOUS_MONTH),
          data: previousDataPoints,
          backgroundColor: 'rgba(0, 0, 128, 0.5)',
        },
        {
          label: i18n(keys.CURRENT_MONTH),
          data: currentDataPoints,
          backgroundColor: 'rgba(0, 128, 0, 0.5)',
        },
      ],
    };
    const options = this.creatOptions({
      xLabel: 'Fleet Name',
      yLabel: 'Average Session Length (minutes)',
    });

    return this.renderBarGraph(i18n(keys.AVERAGE_SESSION_LENGTH_BY_FLEET), data, options);
  }

  renderSessionGraph() {
    const store = this.getStore();

    const { labels, previousDataPoints, currentDataPoints } = store.getNumberOfSessionsData();
    const data = {
      // Only take the day component of the date
      labels: labels.map(l => {
        return new Intl.DateTimeFormat().format(new Date(l));
      }),
      datasets: [
        {
          label: i18n(keys.PREVIOUS_MONTH),
          data: previousDataPoints,
          backgroundColor: 'rgba(0, 0, 128, 0.5)',
        },
        {
          label: i18n(keys.CURRENT_MONTH),
          data: currentDataPoints,
          backgroundColor: 'rgba(0, 128, 0, 0.5)',
        },
      ],
    };

    const options = this.creatOptions({
      xLabel: 'Date',
      yLabel: 'Number of Sessions',
    });

    return this.renderBarGraph(i18n(keys.DAILY_SESSIONS), data, options);
  }

  creatOptions({ xLabel, yLabel }) {
    const options = {
      scales: {
        xAxes: [
          {
            scaleLabel: { display: Boolean(xLabel), labelString: xLabel },
          },
        ],
        yAxes: [
          {
            scaleLabel: { display: Boolean(yLabel), labelString: yLabel },
          },
        ],
      },
    };
    return options;
  }

  renderBarGraph(title, data, options) {
    return (
      <>
        <div className="fs-9 center mt1 mb1">{title}</div>
        <Bar data={data} options={options} width={250} height={120} />
      </>
    );
  }
}

export default inject('metricsStore')(withRouter(observer(VamDashboard)));
