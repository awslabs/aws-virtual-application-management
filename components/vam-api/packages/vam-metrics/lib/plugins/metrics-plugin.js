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

const settingKeys = {
  appstreamUsageReportsGlueDbName: 'appstreamUsageReportsGlueDbName',
  metricsBucket: 'metricsBucket',
};

const getQueries = ({ settings }) => {
  const dbName = settings.get(settingKeys.appstreamUsageReportsGlueDbName);
  return [
    {
      name: 'AverageSessionLengthCurrentMonth',
      query: `
      SELECT stack_name,
        ROUND(AVG(CEIL(CAST(session_duration_in_seconds AS DOUBLE) / 60)), 2) AS avg_session_length_in_minutes,
        ROUND(AVG(CEIL(CAST(session_duration_in_seconds AS DOUBLE) / 3600)), 2) AS avg_session_length_in_hours
      
      FROM "${dbName}"."sessions"
      
      WHERE
        year = DATE_FORMAT(current_date, '%Y')
        AND month = DATE_FORMAT(current_date, '%m')
        AND session_start_time >= DATE_FORMAT(current_date, '%Y-%m-01')
      
      GROUP BY stack_name
      ORDER BY avg_session_length_in_minutes DESC;`,
    },
    {
      name: 'AverageSessionLengthPreviousMonth',
      query: `
      SELECT stack_name,
        ROUND(AVG(CEIL(CAST(session_duration_in_seconds AS DOUBLE) / 60)), 2) AS avg_session_length_in_minutes,
        ROUND(AVG(CEIL(CAST(session_duration_in_seconds AS DOUBLE) / 3600)), 2) AS avg_session_length_in_hours
      
      FROM "${dbName}"."sessions"
      
      WHERE
        ((year = DATE_FORMAT(date_add('month', -1, current_date), '%Y')
        AND month = DATE_FORMAT(date_add('month', -1, current_date), '%m'))
      
        OR
      
        (year = DATE_FORMAT(current_date, '%Y')
        AND month = DATE_FORMAT(current_date, '%m')
        AND day <= '05'))
      
        AND session_start_time >= DATE_FORMAT(date_add('month', -1, current_date), '%Y-%m-01')
        AND session_start_time < DATE_FORMAT(current_date, '%Y-%m-01')
      
      GROUP BY stack_name
      ORDER BY avg_session_length_in_minutes DESC;`,
    },
    {
      name: 'DailySessionsCurrentMonth',
      query: `
      SELECT SUBSTRING(session_start_time, 1, 10) AS report_date,
        COUNT(DISTINCT user_session_id) AS num_sessions
      FROM "${dbName}"."sessions"
      WHERE
        year = DATE_FORMAT(current_date, '%Y')
        AND month = DATE_FORMAT(current_date, '%m')
        AND session_start_time >= DATE_FORMAT(current_date, '%Y-%m-01')
      GROUP BY 1
      ORDER BY 1;`,
    },
    {
      name: 'DailySessionsPreviousMonth',
      query: `
      SELECT SUBSTRING(session_start_time, 1, 10) AS report_date,
        COUNT(DISTINCT user_session_id) AS num_sessions
      FROM "${dbName}"."sessions"
      WHERE
          ((year = DATE_FORMAT(date_add('month', -1, current_date), '%Y')
          AND month = DATE_FORMAT(date_add('month', -1, current_date), '%m'))
        OR
          (year = DATE_FORMAT(current_date, '%Y')
          AND month = DATE_FORMAT(current_date, '%m')
          AND day <= '05'))
        AND session_start_time >= DATE_FORMAT(date_add('month', -1, current_date), '%Y-%m-01')
        AND session_start_time < DATE_FORMAT(current_date, '%Y-%m-01')
      GROUP BY 1
      ORDER BY 1;`,
    },
  ];
};

const generateMetricReports = async ({ log, settings, servicesContainer }) => {
  const aws = await servicesContainer.find('aws');
  const metricsBucket = settings.get(settingKeys.metricsBucket);
  const athena = new aws.sdk.Athena();
  const queries = getQueries({ settings });
  const promises = Promise.all(
    queries.map(async q => {
      const outputLocation = `s3://${metricsBucket}/${q.name}/${new Date().toISOString()}`;
      const params = {
        QueryString: q.query,
        QueryExecutionContext: {
          Catalog: 'AWSDataCatalog',
          Database: 'appstream-usage',
        },
        ResultConfiguration: {
          OutputLocation: outputLocation,
        },
      };
      let result;
      try {
        result = await athena.startQueryExecution(params).promise();
        log.info(`Successfully triggered Athena Query for Metrics: ${q.name}`);
      } catch (e) {
        log.info(`Failed to trigger Athena Query for Metrics: ${q.name}`);
      }
      return result;
    }),
  );
  return promises;
};

export default generateMetricReports;
