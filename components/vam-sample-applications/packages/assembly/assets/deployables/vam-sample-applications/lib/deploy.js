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

const util = require('util');
const exec = util.promisify(require('child_process').exec);
const { init } = require('./utils');

const deploy = async () => {
  const c = await init();
  const bucketName = `${c.awsAccount}-${c.envName}-${c.regionName}-${c.solutionName}-application-repo`;
  console.log(`About to upload applications to ${bucketName}`);
  const profile = c.awsProfile ? ` --profile ${c.awsProfile}` : '';
  const cmd = `aws s3 cp --recursive main/.generated-solution/vam-sample-applications/applications s3://${bucketName}/applications ${profile}`;
  await exec(cmd);
};

module.exports = { deploy };
