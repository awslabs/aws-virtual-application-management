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

import { awsHelper } from '@aws-ee/base-script-utils';
import { retry } from '@aws-ee/base-services';

async function remove(slsPlugin, _pluginRegistry) {
  slsPlugin.cli.warn('--- Removing vam-api ... \n\n');
  const emptyTry = verboseTry({
    slsPlugin,
    operationSuccessLabel: 'Emptied ',
    operationFailLabel: 'Failed to empty ',
  });
  // ensure that the files from certain buckets are deleted
  if (process.env.FORCE_DELETE && process.env.FORCE_DELETE === 'true') {
    await emptyTry({
      fn: () => emptyBucketsBySuffix(slsPlugin, '-dap-config'),
      itemLabel: 'Dynamic Catalog Configuration Bucket',
    });
    await emptyTry({
      fn: () => emptyBucketsBySuffix(slsPlugin, '-application-repo'),
      itemLabel: 'Application Repository Bucket',
    });
    await emptyTry({
      fn: () => emptyBucketsBySuffix(slsPlugin, '-docs-site'),
      itemLabel: 'Documentation Website Bucket',
    });
    await emptyTry({
      fn: () => emptyBucketsBySuffix(slsPlugin, '-installer-work'),
      itemLabel: 'Installer Work Bucket',
    });
    await emptyTry({
      fn: () => emptyBucketsBySuffix(slsPlugin, '-gpo-templates'),
      itemLabel: 'GPO Templates Bucket',
    });
    await emptyTry({
      fn: () => emptyBucketsBySuffix(slsPlugin, '-metrics'),
      itemLabel: 'Metrics Bucket',
    });
  }
  await removeGlueRoles(slsPlugin);
  slsPlugin.cli.warn('--- Successfully removed vam-api ---\n\n');
}

/**
 * Empties all buckets in a stage that match a suffix. Useful for when you may not
 * have access to the complete bucket name.
 * @param {string} suffix
 */
const emptyBucketsBySuffix = async (slsPlugin, suffix) => {
  const settings = slsPlugin.serverless.service.custom.settings;
  const { awsRegion, awsProfile, envName, solutionName } = settings;
  const s3Client = awsHelper.getClientSdk({
    clientName: 'S3',
    awsProfile,
    awsRegion,
  });
  const buckets = await s3Client.listBuckets().promise();
  const deploymentBuckets = buckets.Buckets.filter(
    // Stage is surrounded by '-', so add hyphens to prevent
    // 'rod' matching 'production'.
    bucket =>
      bucket.Name.includes(`-${envName}-`) && bucket.Name.includes(`-${solutionName}-`) && bucket.Name.endsWith(suffix),
  ).map(({ Name }) => Name);
  return Promise.all(deploymentBuckets.map(name => emptyBucket(slsPlugin, s3Client, name)));
};

/**
 * Empties the contents of a bucket.
 * @param {string} name
 */
const emptyBucket = async (slsPlugin, s3Client, name) => {
  // First delete the objects in the bucket
  slsPlugin.cli.warn(`Emptying bucket ${name}`);
  let isTruncated = true;
  let keyMarker;
  let versionIdMarker;
  slsPlugin.cli.log(`Suspending versioning on bucket ${name}.`);
  const versioningParams = {
    Bucket: name,
    VersioningConfiguration: {
      MFADelete: 'Disabled',
      Status: 'Suspended',
    },
  };
  await s3Client.putBucketVersioning(versioningParams).promise();
  const getDeleteInfo = ({ Key, VersionId }) => ({ Key, VersionId });
  while (isTruncated) {
    /** @type {AWS.S3.ListObjectVersionsOutput} */
    const response = await s3Client // eslint-disable-line no-await-in-loop
      .listObjectVersions({ Bucket: name, KeyMarker: keyMarker, VersionIdMarker: versionIdMarker })
      .promise();
    isTruncated = response.IsTruncated;
    keyMarker = response.KeyMarker;
    versionIdMarker = response.VersionIdMarker;

    const versions = [...response.DeleteMarkers.map(getDeleteInfo), ...response.Versions.map(getDeleteInfo)];
    if (versions.length > 0) {
      const deletionResponses = await s3Client.deleteObjects({ Bucket: name, Delete: { Objects: versions } }).promise(); // eslint-disable-line no-await-in-loop
      if (deletionResponses.Errors.length) {
        throw new Error(`Failed to delete all objects in bucket ${name}`);
      }
    }
  }
};

/**
 * @param {{operationSuccessLabel: String, operationFailLabel: String}} params
 * @returns {({fn: Function, itemLabel: String}) => Promise<void>}
 */
const verboseTry = ({ slsPlugin, operationSuccessLabel, operationFailLabel }) => async ({ fn, itemLabel }) => {
  try {
    await fn();
    slsPlugin.cli.log(`${operationSuccessLabel}${itemLabel}`);
  } catch (error) {
    slsPlugin.cli.warn(`${operationFailLabel}${itemLabel} - error: ${error}`);
  }
};

const removeGlueRoles = async slsPlugin => {
  const deleteTry = verboseTry({
    slsPlugin,
    operationSuccessLabel: 'Deleted ',
    operationFailLabel: 'Failed to delete ',
  });
  const settings = slsPlugin.serverless.service.custom.settings;
  const { namespace, awsRegion, awsProfile } = settings;

  /** @type {AWS.Glue} */
  const glue = awsHelper.getClientSdk({
    clientName: 'Glue',
    awsProfile,
    awsRegion,
  });

  // Glue crawlers
  await deleteTry({
    fn: () => glue.deleteCrawler({ Name: `${namespace}-appstream-usage-sessions-crawler` }).promise(),
    itemLabel: 'usage sessions crawler',
  });
  await deleteTry({
    fn: () => glue.deleteCrawler({ Name: `${namespace}-appstream-usage-applications-crawler` }).promise(),
    itemLabel: 'usage applications crawler',
  });

  // Glue classifier
  await deleteTry({
    fn: () => glue.deleteClassifier({ Name: `${namespace}-appstream-usage-csv-classifier` }).promise(),
    itemLabel: 'usage csv classifier',
  });

  // Glue database
  await deleteTry({
    fn: () => glue.deleteDatabase({ Name: `${namespace}-appstream-usage` }).promise(),
    itemLabel: 'appstream usage glue database',
  });

  // IAM role policy
  /** @type {AWS.STS} */
  const sts = awsHelper.getClientSdk({
    clientName: 'STS',
    awsProfile,
    awsRegion,
  });
  const result = await sts.getCallerIdentity().promise();

  const appstreamUsageReportGlueRole = `${namespace}-AppstreamUsageReportGlueRole`;
  const appstreamGlueS3CrawlPolicyName = `${namespace}-AppstreamAllowGlueToCrawlS3`;
  const policyArn = `arn:aws:iam::${result.Account}:policy/${appstreamGlueS3CrawlPolicyName}`;

  /** @type {AWS.IAM} */
  const iam = awsHelper.getClientSdk({
    clientName: 'IAM',
    awsProfile,
    awsRegion,
  });
  const detatchTry = verboseTry({
    slsPlugin,
    operationSuccessLabel: 'Detached ',
    operationFailLabel: 'Failed to detach ',
  });
  detatchTry({
    fn: () =>
      iam
        .detachRolePolicy({
          PolicyArn: policyArn,
          RoleName: appstreamUsageReportGlueRole,
        })
        .promise(),
    itemLabel: 'glue crawler role policy',
  });

  // Previous detachment of the role policy takes time to take effect.
  // Wait a little bit (with retries) to see if this really happens.
  await deleteTry({
    fn: () => retry(() => iam.deletePolicy({ PolicyArn: policyArn }).promise(), 5),
    itemLabel: 'glue crawler role policy',
  });
};

const plugin = {
  remove,
};

export default plugin;
