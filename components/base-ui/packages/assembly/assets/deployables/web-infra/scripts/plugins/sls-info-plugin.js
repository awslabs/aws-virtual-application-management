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

/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}] */
import { cfnHelper } from '@aws-ee/base-script-utils';

// eslint-disable-next-line no-unused-vars
async function getInfo(existingInfo, slsPlugin, pluginRegistry) {
  const settings = slsPlugin.serverless.service.custom.settings;

  const { namespace, awsRegion, awsProfile } = settings;

  const websiteUrl = (
    await cfnHelper.getCfnOutput({
      awsProfile,
      awsRegion,
      stackName: `${namespace}-webinfra`,
      outputKey: 'WebsiteUrl',
    })
  )?.value;
  const docsUrl = (
    await cfnHelper.getCfnOutput({
      awsProfile,
      awsRegion,
      stackName: `${namespace}-webinfra`,
      outputKey: 'DocsSiteUrl',
    })
  )?.value;

  const wafAllowListId = (
    await cfnHelper.getCfnOutput({
      awsProfile,
      awsRegion,
      stackName: `${namespace}-webinfra`,
      outputKey: 'WebsiteAllowListId',
    })
  )?.value;

  if (!websiteUrl && !docsUrl) {
    return existingInfo;
  }
  const info = new Map(existingInfo);
  // Append other info variables here
  if (websiteUrl) {
    info.set('websiteUrl', { value: websiteUrl, title: 'Website URL', display: true });
  }
  if (docsUrl) {
    info.set('docsUrl', { value: docsUrl, title: 'Docs URL', display: true });
  }
  if (wafAllowListId) {
    info.set('wafNotice', {
      value: 'WAF appears to be configured. To access the website URL make sure your IP is in the allow list.',
      title: 'WAF Warning!',
      display: true,
    });
  }

  return info;
}

const plugin = {
  info: getInfo,
};

export default plugin;
