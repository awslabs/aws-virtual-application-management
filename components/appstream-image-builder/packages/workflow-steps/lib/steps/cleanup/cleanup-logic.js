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

import { StepBase } from '@aws-ee/base-workflow-core';
import { awsHelper } from '@aws-ee/base-script-utils';

const inPayloadKeys = {
  imageBuilderID: 'imageBuilderID',
  installerHostInstanceID: 'installerHostInstanceID',
};

class Cleanup extends StepBase {
  async start() {
    const imageBuilderID = await this.payloadOrConfig.string(inPayloadKeys.imageBuilderID);
    const installerHostInstanceID = await this.payloadOrConfig.string(inPayloadKeys.installerHostInstanceID);
    const appstream = awsHelper.getClientSdk({ clientName: 'AppStream' });
    const ec2Client = awsHelper.getClientSdk({ clientName: 'EC2' });

    await appstream.deleteImageBuilder({ Name: imageBuilderID }).promise();
    await ec2Client.stopInstances({ InstanceIds: [installerHostInstanceID] }).promise();

    return true;
  }

  inputKeys() {
    return {};
  }

  outputKeys() {
    return {};
  }
}

export default Cleanup;
