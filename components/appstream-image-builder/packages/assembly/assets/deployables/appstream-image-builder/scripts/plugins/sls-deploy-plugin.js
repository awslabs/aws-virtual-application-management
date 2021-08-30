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

import { awsHelper, cfnHelper, getSlsDeployPlugin } from '@aws-ee/base-script-utils';
import archiver from 'archiver';
import stream from 'stream';
import path from 'path';

const slsProjDir = path.normalize(path.join(__dirname, '../../'));
const deployPlugin = getSlsDeployPlugin(slsProjDir);
/**
 * A function to perform any additional logic when "pnpx solution-deploy" command is invoked
 * @param slsPlugin Reference to the Serverless Framework Plugin object containing the "serverless" and "options" objects
 *
 * @param pluginRegistry A registry that provides plugins registered by various components for the specified extension point.
 *
 * @returns {Promise<void>}
 */
// eslint-disable-next-line no-unused-vars
async function deploy(slsPlugin, pluginRegistry) {
  await deployPlugin.deploy(slsPlugin, pluginRegistry);
  const settings = slsPlugin.serverless.service.custom.settings;

  const { namespace, awsRegion, awsProfile } = settings;

  const gpoTemplateBucket = (
    await cfnHelper.getCfnOutput({
      awsProfile,
      awsRegion,
      stackName: `${namespace}-image-builder`,
      outputKey: 'GPOTemplateBucket',
    })
  ).value;

  const s3Client = awsHelper.getClientSdk({
    clientName: 'S3',
    awsProfile,
    awsRegion,
  });

  const key = 'gpo.zip';
  const sourceDirectory = path.join(__dirname, '../../data');

  slsPlugin.cli.log(`Uploading ${key} to ${gpoTemplateBucket} from ${sourceDirectory}`);

  await zipDirectoryToS3({
    sourceDirectory,
    bucket: gpoTemplateBucket,
    key,
    s3Client,
  });
}

const zipDirectoryToS3 = ({ sourceDirectory, bucket, key, s3Client }) => {
  const archive = archiver('zip', { zlib: { level: 9 } });
  const uploadStream = new stream.PassThrough();
  const output = s3Client.upload({ Bucket: bucket, Key: key, Body: uploadStream }).promise();

  return new Promise((resolve, reject) => {
    archive
      // Add all files in this directory as root objects in the zip
      .directory(sourceDirectory, false)
      .on('error', reject)
      .pipe(uploadStream);

    archive.finalize();
    output.then(data => resolve(data));
  });
};

const plugin = {
  deploy,
};

export default plugin;
