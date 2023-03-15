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

/* eslint-disable no-console */

import aws from 'aws-sdk';
import { StepBase } from '@aws-ee/base-workflow-core';
import { imageBuilderCommandViaSSM } from '../../execute-via-ssm';

const inPayloadKeys = {
  dapEnabled: 'dapEnabled',
  imageBuilderID: 'imageBuilderID',
  installerHostInstanceID: 'installerHostInstanceID',
};

const settingsKeys = {
  adDomainName: 'adDomainName',
  namespace: 'namespace',
  imageBuilderADCredentialsArn: 'imageBuilderADCredentialsArn',
  installerHostWorkBucketName: 'installerHostWorkBucketName',
  ou: 'ou',
};

class WaitForImageBuilder extends StepBase {
  async start() {
    const settings = await this.mustFindServices('settings');
    const adDomainName = settings.get(settingsKeys.adDomainName);
    const namespace = settings.get(settingsKeys.namespace);
    const imageBuilderADCredentialsArn = settings.get(settingsKeys.imageBuilderADCredentialsArn);
    const installerHostWorkBucketName = settings.get(settingsKeys.installerHostWorkBucketName);
    const ou = settings.get(settingsKeys.ou);
    const imageName = this.workflowInstance.wf.title;
    const imageBuilderID = await this.payloadOrConfig.string(inPayloadKeys.imageBuilderID);
    const dapEnabled = await this.payloadOrConfig.boolean(inPayloadKeys.dapEnabled);
    const installerHostInstanceID = await this.payloadOrConfig.string(inPayloadKeys.installerHostInstanceID);

    const name = `${namespace}-image-builder`;
    if (!dapEnabled) {
      let script = `
        $Env:Path += ';C:\\Program Files\\Amazon\\Photon\\ConsoleImageBuilder\\'
        image-assistant.exe create-image --name "${imageName}" --tags Name ${name} 
      `;
      } else {
        let script = `
          $Env:Path += ';C:\\Program Files\\Amazon\\Photon\\ConsoleImageBuilder\\'
          image-assistant.exe create-image --name "${imageName}" --tags Name ${name} --enable-dynamic-app-catalog
        `;
      }

    // XXX just waiting for the effect, not the actual SendCommand to finish.
    await imageBuilderCommandViaSSM({
      instanceID: installerHostInstanceID,
      imageBuilderID,
      workBucket: installerHostWorkBucketName,
      domain: adDomainName,
      ou,
      domainCredentialsArn: imageBuilderADCredentialsArn,
      script,
    });

    return this.wait(5)
      .maxAttempts(3600)
      .until('snapshotFinished');
  }

  // wait for state to go from SNAPSHOTTING to STOPPED
  async snapshotFinished() {
    const imageBuilderID = await this.payloadOrConfig.string(inPayloadKeys.imageBuilderID);
    const appstream = new aws.AppStream();
    const res = await appstream.describeImageBuilders().promise();
    console.log(`Waiting for ${imageBuilderID} snapshot`);
    // eslint-disable-next-line no-restricted-syntax
    for (const ib of res.ImageBuilders) {
      if (ib.State === 'STOPPED' && ib.Name === imageBuilderID) {
        return true;
      }
    }

    return false;
  }

  inputKeys() {
    return {
      [inPayloadKeys.imageBuilderID]: 'string',
      [inPayloadKeys.dapEnabled]: 'boolean',
    };
  }

  outputKeys() {
    return {};
  }
}

export default WaitForImageBuilder;
