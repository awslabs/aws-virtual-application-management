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
import aws from 'aws-sdk';
import { v4 as uuid } from 'uuid';

const inPayloadKeys = {
  dapEnabled: 'dapEnabled',
  instanceType: 'instanceType',
  appstreamImageArn: 'appstreamImageArn',
};

const outPayloadKeys = {
  imageBuilderID: 'imageBuilderID',
  dapEnabled: 'dapEnabled',
};

const settingsKeys = {
  adDomainName: 'adDomainName',
  namespace: 'namespace',
  ou: 'ou',
  subnet: 'activeDirectoryVPCSubnet',
  imageBuilderIAMRoleArn: 'imageBuilderIAMRoleArn',
  securityGroupId: 'imageBuilderSecurityGroupId',
};

class LaunchImageBuilder extends StepBase {
  async start() {
    const settings = await this.mustFindServices('settings');
    const namespace = settings.get(settingsKeys.namespace);
    const adDomainName = settings.get(settingsKeys.adDomainName);
    const ou = settings.get(settingsKeys.ou);
    const subnet = settings.get(settingsKeys.subnet);
    const imageBuilderIAMRoleArn = settings.get(settingsKeys.imageBuilderIAMRoleArn);
    const securityGroupId = settings.get(settingsKeys.securityGroupId);
    const imageBuilderID = `image-builder-${uuid()}`;

    const appstreamImageArn = await this.payloadOrConfig.string(inPayloadKeys.appstreamImageArn);
    const dapEnabled = await this.payloadOrConfig.boolean(inPayloadKeys.dapEnabled);
    const instanceType = await this.payloadOrConfig.string(inPayloadKeys.instanceType);

    const appstream = new aws.AppStream();

    const params = {
      InstanceType: instanceType,
      Name: imageBuilderID,
      DomainJoinInfo: {
        DirectoryName: adDomainName,
        OrganizationalUnitDistinguishedName: ou,
      },
      ImageArn: appstreamImageArn,
      IamRoleArn: imageBuilderIAMRoleArn,
      VpcConfig: {
        SubnetIds: [subnet],
        SecurityGroupIds: [securityGroupId],
      },
      EnableDefaultInternetAccess: false,
      Tags: {
        ImageBuilderID: imageBuilderID,
        Name: `${namespace}-image-builder`,
      },
    };

    try {
      await appstream.createImageBuilder(params).promise();
    } catch (err) {
      if (err.code === 'LimitExceededException') {
        const limit = err.message.slice(-1);
        err.message = `Your account has reached its limit of ${limit} image builders or the requested instance type. Please contact your system administrator to remove one or more image builders or request an account increase.`;
      }
      throw err;
    }
    await this.payload.setKey(outPayloadKeys.imageBuilderID, imageBuilderID);
    await this.payload.setKey(outPayloadKeys.dapEnabled, dapEnabled);

    return this.wait(60)
      .maxAttempts(3600)
      .until('shouldResumeWorkflow');
  }

  // wait for state to go from PENDING to RUNNING
  async shouldResumeWorkflow() {
    const imageBuilderID = await this.payloadOrConfig.string(outPayloadKeys.imageBuilderID);
    const appstream = new aws.AppStream();
    const res = await appstream.describeImageBuilders().promise();
    // eslint-disable-next-line no-restricted-syntax
    for (const ib of res.ImageBuilders) {
      if (ib.State === 'RUNNING' && ib.Name === imageBuilderID) {
        return true;
      }
    }

    return false;
  }

  inputKeys() {
    return {
      [inPayloadKeys.dapEnabled]: 'boolean',
      [inPayloadKeys.instanceType]: 'string',
    };
  }

  outputKeys() {
    return {
      [outPayloadKeys.imageBuilderID]: 'string',
      [outPayloadKeys.dapEnabled]: 'boolean',
    };
  }
}

export default LaunchImageBuilder;
