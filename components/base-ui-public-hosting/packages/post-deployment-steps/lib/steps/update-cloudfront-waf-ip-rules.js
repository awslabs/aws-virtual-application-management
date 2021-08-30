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

import { Service } from '@aws-ee/base-services-container';

const settingKeys = {
  cloudFrontAllowListId: 'cloudFrontAllowListId',
  cloudFrontAllowListSecretName: 'cloudFrontAllowListSecretName',
};

/**
 * Post-deployment step implementation that updates the CloudFront WAF IP Rules configured in Parameter Store secret string.
 */
class UpdateCloudFrontWafIpRules extends Service {
  constructor() {
    super();
    this.dependency(['aws']);
  }

  async init() {
    await super.init();
  }

  async execute() {
    const aws = await this.service('aws');
    const ipSetAllowListId = this.settings.get(settingKeys.cloudFrontAllowListId);
    const ipSetConfig = await this._getIpConfig();

    if (_.isEmpty(ipSetAllowListId)) {
      this.log.info('No WAF WebACL configured');
      return;
    }

    const wafApi = new aws.sdk.WAF();
    const updates = await this._getUpdates(wafApi, ipSetAllowListId, ipSetConfig);
    if (_.isEmpty(updates)) {
      this.log.info('No updates to WAF configuration');
      return;
    }

    const changeTokenResponse = await wafApi.getChangeToken({}).promise();
    const wafParams = {
      ChangeToken: changeTokenResponse.ChangeToken,
      IPSetId: ipSetAllowListId,
      Updates: updates,
    };

    this.log.info(`Attempting to update WAF AllowList for CloudFront with ${updates.length} changes`);
    await wafApi.updateIPSet(wafParams).promise();
  }

  async _getIpConfig() {
    const aws = await this.service('aws');
    const ssm = new aws.sdk.SSM({ apiVersion: '2014-11-06' });
    const paramStoreIpConfigSecretName = this.settings.get(settingKeys.cloudFrontAllowListSecretName);

    let doesKeyExist = false;
    /**
     * Parameter value should have the following structure:
     * [
     *   {
     *     "Type": "IPV4",
     *     "Value": "192.168.0.1/28"
     *   },
     *   {
     *     "Type": "IPV4",
     *     "Value": "10.0.0.1/28"
     *   },
     * ]
     */
    let parameterValue = '[{"Type": "IPV4", "Value": "127.0.0.1/32"}]';
    try {
      const parameterResponse = await ssm
        .getParameter({ Name: paramStoreIpConfigSecretName, WithDecryption: true })
        .promise();
      parameterValue = _.get(parameterResponse, 'Parameter.Value');
      doesKeyExist = true;
    } catch (err) {
      if (err.code !== 'ParameterNotFound') {
        // Swallow "ParameterNotFound" and let all other errors bubble up
        throw err;
      }
    }

    if (doesKeyExist) {
      this.log.info(
        `CloudFront WAF Allow List IP Configuration already exists in parameter store at ${paramStoreIpConfigSecretName}. Did not reset it.`,
      );
      return JSON.parse(parameterValue);
    }

    await ssm
      .putParameter({
        Name: paramStoreIpConfigSecretName,
        Type: 'SecureString',
        Value: parameterValue,
        Description: `CloudFront WAF Allow List IP Configuration`,
        Overwrite: true,
      })
      .promise();

    this.log.info(
      `Created empty CloudFront WAF Allow List IP Configuration and saved it to parameter store at "${paramStoreIpConfigSecretName}"`,
    );

    return JSON.parse(parameterValue);
    // const aws = await this.service('aws');
    // const secretsManagerApi = new aws.sdk.SecretsManager();

    // const ipSetSecret = await secretsManagerApi.getSecretValue({ SecretId: ipSetSecretArn }).promise();
    // let ipSetConfig;
    // try {
    //   ipSetConfig = JSON.parse(ipSetSecret.SecretString);
    //   if (!_.isArray(ipSetConfig)) {
    //     throw new Error('IP Set should be JSON array');
    //   }
    // } catch (e) {
    //   this.log.info(`Error ${e.message}`);
    //   throw new Error('Incorrect WAF IP Set configuration in Secrets Manager');
    // }

    // if (_.isEmpty(ipSetConfig)) {
    //   this.log.warn(`No WAF IPSet has been configured, you may not be able to access the UI`);
    // }

    // return ipSetConfig;
  }

  async _getUpdates(wafApi, ipSetAllowListId, ipSetConfig) {
    const existingIPConfigResponse = await wafApi.getIPSet({ IPSetId: ipSetAllowListId }).promise();
    const existingIPConfig = _.get(existingIPConfigResponse, 'IPSet.IPSetDescriptors');

    // Find the new IPs to add
    const ipsToAdd = _.differenceWith(ipSetConfig, existingIPConfig, _.isEqual);
    // Find the existing IPs to delete
    const ipsToDelete = _.differenceWith(existingIPConfig, ipSetConfig, _.isEqual);

    const ipsInsert = ipsToAdd.map(ipSet => {
      return {
        Action: 'INSERT',
        IPSetDescriptor: ipSet,
      };
    });

    const ipsDelete = ipsToDelete.map(ipSet => {
      return {
        Action: 'DELETE',
        IPSetDescriptor: ipSet,
      };
    });

    const updates = ipsInsert.concat(ipsDelete);
    return updates;
  }
}

export default UpdateCloudFrontWafIpRules;
