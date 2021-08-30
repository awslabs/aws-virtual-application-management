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
import path from 'path';
import * as fs from 'fs';

/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
import { cfnHelper } from '@aws-ee/base-script-utils';
import { merged as mergeSettings } from '../../config/settings/.settings';

// eslint-disable-next-line no-unused-vars
async function getInfo(existingInfo, slsPlugin, pluginRegistry) {
  const stage = _.get(slsPlugin, 'options.stage');
  const stageConfigPath = path.normalize(path.join(slsPlugin.cwd, `main/config/settings/cicd-target/${stage}.yml`));

  if (!fs.existsSync(stageConfigPath)) {
    slsPlugin.cli.log('CICD target configuration does not exist. Assuming CICD not configured for this stage');
    return existingInfo;
  }

  const serverless = _.cloneDeep(slsPlugin.serverless);

  const { namespace } = serverless.service.custom.settings;
  const { awsRegion, awsProfile } = await mergeSettings(serverless);

  const appDeployerRoleArn = await cfnHelper.getCfnOutput({
    awsProfile,
    awsRegion,
    stackName: `${namespace}-cicd-target`,
    outputKey: 'AppDeployerRoleArn',
  });

  const info = new Map([
    ...existingInfo,
    [
      'cicdAppDeployerRoleArn',
      { value: appDeployerRoleArn.value, title: 'CICD Target App Deployer Role ARN', display: false },
    ],
  ]);
  return info;
}

const plugin = {
  location: __filename,
  info: getInfo,
};

export default plugin;
