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

import { Service } from '@aws-ee/base-services-container';

const settingKeys = {
  loggingBucketName: 'loggingBucketName',
  deploymentBucketName: 'deploymentBucketName',
};

/**
 * Post-deployment step to ensure S3 Access Logging is enabled
 * on the S3 buckets used by the Serverless Framework to store
 * deployment artifacts.
 *
 * There does not appear to be a way to configure this via the
 * "serverless-deployment-bucket" Serverless Framework plugin.
 *
 * @extends {Service}
 */
class EnableAccessLogging extends Service {
  constructor() {
    super();
    this.dependency(['aws', 's3Service']);
  }

  async ensureAccessLoggingEnabledOnDeploymentBuckets() {
    this.aws = await this.service('aws');
    this.s3Service = await this.service('s3Service');
    this.s3Api = new this.aws.sdk.S3({ signatureVersion: 'v4' });
    this.loggingBucketName = this.settings.get(settingKeys.loggingBucketName);
    this.deploymentBucketName = this.settings.get(settingKeys.deploymentBucketName);

    // We don't include us-east-1 deployment bucket (created if, for example Lambda@Edge
    // is used in the solution) because cross-region access logging is not allowed
    const buckets = [this.deploymentBucketName];
    const promises = buckets.map(async bucketName => {
      const doesBucketExist = await this.s3Service.doesS3LocationExist(`s3://${bucketName}`);
      if (!doesBucketExist) {
        return;
      }
      this.log.info(`Ensuring access logging is enabled on bucket "${bucketName}"`);
      await this._ensureAccessLoggingEnabledOnDeploymentBucket(bucketName);
    });
    await Promise.all(promises);
  }

  async _ensureAccessLoggingEnabledOnDeploymentBucket(bucketName) {
    const isAccessLoggingEnabled = await this._isAccessLoggingEnabled(bucketName);
    if (isAccessLoggingEnabled) {
      this.log.info('Access logging is already enabled');
      return;
    }

    this.log.info('Access logging is not yet enabled');
    try {
      await this._enableAccessLogging(bucketName);
    } catch (err) {
      this.log.error('Unexpected error while enabling access logging');
      throw err;
    }

    this.log.info('Successfully enabled access logging');
  }

  async _isAccessLoggingEnabled(bucketName) {
    const resp = await this.s3Api.getBucketLogging({ Bucket: bucketName }).promise();
    return resp.LoggingEnabled;
  }

  async _enableAccessLogging(bucketName) {
    const params = {
      Bucket: bucketName,
      BucketLoggingStatus: {
        LoggingEnabled: {
          TargetBucket: this.loggingBucketName,
          TargetPrefix: `${this.loggingBucketName}-bucket/`,
        },
      },
    };
    await this.s3Api.putBucketLogging(params).promise();
  }

  async execute() {
    await this.ensureAccessLoggingEnabledOnDeploymentBuckets();
  }
}

export { EnableAccessLogging };
