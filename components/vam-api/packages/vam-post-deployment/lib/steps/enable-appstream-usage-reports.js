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

import Service from '@aws-ee/base-services-container/lib/service';

const settingsKeys = {
  appstreamUsageReportGlueRole: 'appstreamUsageReportGlueRole',
  appstreamGlueS3CrawlPolicyName: 'appstreamGlueS3CrawlPolicyName',
  appstreamUsageReportsGlueDbName: 'appstreamUsageReportsGlueDbName',
  appstreamUsageApplicationsCsvClassifier: 'appstreamUsageApplicationsCsvClassifier',
  appstreamUsageSessionsCrawlerName: 'appstreamUsageSessionsCrawlerName',
  appstreamUsageApplicationsCrawlerName: 'appstreamUsageApplicationsCrawlerName',
};

const SESSIONS_CRAWLER_PATH = 'sessions';
const APPLICATIONS_CRAWLER_PATH = 'applications';
const CRON_SCHEDULE = 'cron(0 23 * * ? *)'; // Daily at 23:00 UTC

class EnableAppstreamUsageReports extends Service {
  constructor() {
    super();
    this.dependency(['aws']);
  }

  async getAccountId() {
    const [aws] = await this.service(['aws']);
    const sts = new aws.sdk.STS();
    const result = await sts.getCallerIdentity().promise();
    return result.Account;
  }

  async createAppStreamUsageReports() {
    const [aws] = await this.service(['aws']);
    const appstream = new aws.sdk.AppStream();
    const result = await appstream.createUsageReportSubscription({}).promise();
    return result.S3BucketName;
  }

  async getAppstreamUsageReportGlueRole() {
    const [aws, settings] = await this.service(['aws', 'settings']);
    const iam = new aws.sdk.IAM();
    const roleName = settings.get(settingsKeys.appstreamUsageReportGlueRole);
    const result = await iam.getRole({ RoleName: roleName }).promise();
    this.log.info(`Role '${roleName}' retrieved successfully`);
    return result.Role;
  }

  async attachS3PolicyToRole({ accountId, s3MetricsBucket }) {
    const [aws, settings] = await this.service(['aws', 'settings']);
    const iam = new aws.sdk.IAM();
    const roleName = settings.get(settingsKeys.appstreamUsageReportGlueRole);
    const appstreamGlueS3CrawlPolicyName = settings.get(settingsKeys.appstreamGlueS3CrawlPolicyName);
    const policyArn = `arn:aws:iam::${accountId}:policy/${appstreamGlueS3CrawlPolicyName}`;

    let glueCrawlPolicy;
    try {
      glueCrawlPolicy = await iam.getPolicy({ PolicyArn: policyArn }).promise();
      this.log.info(`Policy '${appstreamGlueS3CrawlPolicyName}' already exists`);
    } catch (e) {
      if (e.code === 'NoSuchEntity') {
        const s3AccessPolicyDocument = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['s3:GetObject'],
              Resource: `arn:aws:s3:::${s3MetricsBucket}/${SESSIONS_CRAWLER_PATH}/*`,
            },
            {
              Effect: 'Allow',
              Action: ['s3:GetObject'],
              Resource: `arn:aws:s3:::${s3MetricsBucket}/${APPLICATIONS_CRAWLER_PATH}/*`,
            },
          ],
        };
        glueCrawlPolicy = await iam
          .createPolicy({
            PolicyName: appstreamGlueS3CrawlPolicyName,
            PolicyDocument: JSON.stringify(s3AccessPolicyDocument),
          })
          .promise();
        this.log.info(`Policy '${appstreamGlueS3CrawlPolicyName}' was successfully created`);
      } else {
        throw e;
      }
    }

    await iam
      .attachRolePolicy({
        PolicyArn: glueCrawlPolicy.Policy.Arn,
        RoleName: roleName,
      })
      .promise();
    this.log.info(`S3Policy '${appstreamGlueS3CrawlPolicyName}' successfully attached to role`);
  }

  async createAppstreamUsageDatabase() {
    const [aws, settings] = await this.service(['aws', 'settings']);
    const glue = new aws.sdk.Glue();
    const dbName = settings.get(settingsKeys.appstreamUsageReportsGlueDbName);

    let dbResult;
    try {
      dbResult = await glue.getDatabase({ Name: dbName }).promise();
      this.log.info(`Glue Database '${dbName}' already exists`);
    } catch (e) {
      if (e.code === 'EntityNotFoundException') {
        dbResult = await glue
          .createDatabase({
            DatabaseInput: {
              Name: dbName,
              Description: 'AWS Glue container to hold metadata tables for the AppStream Usage Reports.',
            },
          })
          .promise();
        this.log.info(`Glue Database '${dbName}' created successfully`);
      } else {
        throw e;
      }
    }
    return dbResult;
  }

  async createClassifiers() {
    const [aws, settings] = await this.service(['aws', 'settings']);
    const appstreamUsageApplicationsCsvClassifier = settings.get(settingsKeys.appstreamUsageApplicationsCsvClassifier);
    const glue = new aws.sdk.Glue();
    let classifierResult;
    try {
      classifierResult = await glue.getClassifier({ Name: appstreamUsageApplicationsCsvClassifier }).promise();
      this.log.info(`Classifier '${appstreamUsageApplicationsCsvClassifier}' already exists`);
    } catch (e) {
      if (e.code === 'EntityNotFoundException') {
        classifierResult = await glue
          .createClassifier({
            CsvClassifier: {
              Name: appstreamUsageApplicationsCsvClassifier,
              Delimiter: ',',
              QuoteSymbol: '"',
              ContainsHeader: 'PRESENT',
              Header: ['user_session_id', 'application_name'],
              DisableValueTrimming: false,
              AllowSingleColumn: false,
            },
          })
          .promise();
        this.log.info(`Classifier '${appstreamUsageApplicationsCsvClassifier}' created successfully`);
      } else {
        throw e;
      }
    }
    return classifierResult;
  }

  async createCrawlers(s3Bucket, role) {
    const [aws, settings] = await this.service(['aws', 'settings']);
    const dbName = settings.get(settingsKeys.appstreamUsageReportsGlueDbName);
    const glue = new aws.sdk.Glue();

    const appstreamUsageApplicationsCsvClassifier = settings.get(settingsKeys.appstreamUsageApplicationsCsvClassifier);
    const sessionsCrawler = settings.get(settingsKeys.appstreamUsageSessionsCrawlerName);
    const applicationsCrawler = settings.get(settingsKeys.appstreamUsageApplicationsCrawlerName);

    await this.createCrawler({
      glue,
      s3Bucket,
      role,
      dbName,
      // Use the default classifier
      classifier: null,
      name: sessionsCrawler,
      s3Path: SESSIONS_CRAWLER_PATH,
    });
    await this.createCrawler({
      glue,
      s3Bucket,
      role,
      dbName,
      classifier: appstreamUsageApplicationsCsvClassifier,
      name: applicationsCrawler,
      s3Path: APPLICATIONS_CRAWLER_PATH,
    });
  }

  async createCrawler({ glue, s3Bucket, role, dbName, classifier, name, s3Path }) {
    let crawlerResult;

    try {
      crawlerResult = await glue.getCrawler({ Name: name }).promise();
      this.log.info(`Crawler '${name}' already exists`);
    } catch (e) {
      if (e.code === 'EntityNotFoundException') {
        const params = {
          Name: name,
          Role: role.Arn,
          Schedule: CRON_SCHEDULE,
          DatabaseName: dbName,
          Targets: {
            S3Targets: [
              {
                Path: `s3://${s3Bucket}/${s3Path}/`,
              },
            ],
          },
          SchemaChangePolicy: {
            UpdateBehavior: 'UPDATE_IN_DATABASE',
            DeleteBehavior: 'LOG',
          },
          Configuration:
            '{"Version":1.0,"CrawlerOutput":{"Partitions":{"AddOrUpdateBehavior":"InheritFromTable"},"Tables":{"AddOrUpdateBehavior":"MergeNewColumns"}},"Grouping":{"TableGroupingPolicy": "CombineCompatibleSchemas"}}',
        };
        if (classifier) {
          params.Classifiers = [classifier];
        }
        crawlerResult = await glue.createCrawler(params).promise();
        this.log.info(`Crawler '${name}' created successfully`);
      } else {
        throw e;
      }
    }

    return crawlerResult;
  }

  async execute() {
    const accountId = await this.getAccountId();
    const s3MetricsBucket = await this.createAppStreamUsageReports();
    const role = await this.getAppstreamUsageReportGlueRole();
    await this.attachS3PolicyToRole({ accountId, s3MetricsBucket });
    await this.createAppstreamUsageDatabase();
    await this.createClassifiers();
    await this.createCrawlers(s3MetricsBucket, role);
  }
}

module.exports = EnableAppstreamUsageReports;
