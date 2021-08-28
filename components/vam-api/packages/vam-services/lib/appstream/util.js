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

import uuid from 'uuid/v4';
import keys from '../../../vam-api-i18n/dist';

const packageTypes = {
  choco: 'choco',
  powershell: 'powershell',
};

const settingKeys = {
  installerHostWorkBucketName: 'installerHostWorkBucketName',
};

const basicStep = async (requestContext, application, step, configs) => {
  return {
    id: `wf-step_1_${uuid()}_206_2`,
    stepTemplateId: step.id,
    stepTemplateVer: step.v,
    title: `${requestContext.i18n(keys.INSTALL)} ${application.applicationDisplayName}`,
    desc: step.desc,
    skippable: true,
    configs,
  };
};

const chocoStep = async (requestContext, application, stepTemplateService, configs) => {
  const step = (await stepTemplateService.listVersions(requestContext, { id: 'st-install-via-choco' }))[0];
  return basicStep(
    requestContext,
    application,
    step,
    Object.assign(configs, {
      packageName: application.packageInstall.chocoPackage,
      applicationName: application.applicationName,
      applicationDisplayName: application.applicationDisplayName,
      applicationExePath: application.applicationExe,
      applicationVersion: application.applicationVersion,
    }),
  );
};

const powershellStep = async (requestContext, application, stepTemplateService, configs) => {
  const step = (await stepTemplateService.listVersions(requestContext, { id: 'st-install-via-powershell' }))[0];
  return basicStep(
    requestContext,
    application,
    step,
    Object.assign(configs, {
      packageScript: application.packageScript,
      applicationName: application.applicationName,
      applicationDisplayName: application.applicationDisplayName,
      applicationExePath: application.applicationExe,
    }),
  );
};

const executeStep = async (requestContext, application, service, s3Service, dapEnabled, imageBuilderID) => {
  const stepTemplateService = await service.service('stepTemplateService');
  const bucket = service.settings.get(settingKeys.installerHostWorkBucketName);

  const configs = {
    dapEnabled,
  };

  if (imageBuilderID.length > 0) {
    configs.imageBuilderID = imageBuilderID;
  }

  if (application.packageType === packageTypes.choco) {
    return chocoStep(requestContext, application, stepTemplateService, configs);
  }

  if (application.packageType === packageTypes.powershell) {
    // replace reference to file with actual contents
    const key = `${application.infoDir}/${application.packageInstall.script}`;
    application.packageScript = await s3Service.getTextObject(bucket, key);
    return powershellStep(requestContext, application, stepTemplateService, configs);
  }

  throw new Error(`Unsupported package type: ${application.packageType}`);
};

module.exports = executeStep;
