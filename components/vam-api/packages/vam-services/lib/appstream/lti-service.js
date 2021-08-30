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

import lti from 'ims-lti';
import { Service } from '@aws-ee/base-services-container';

const settingKeys = {
  ltiConsumerKey: 'ltiConsumerKey',
  ltiConsumerSecretPrimary: 'ltiConsumerSecretPrimary',
  ltiConsumerSecretSecondary: 'ltiConsumerSecretSecondary',
};

class LTIService extends Service {
  constructor() {
    super();
    this.dependency(['aws']);
  }

  async handleLTIRequest(_requestContext, req) {
    this._cleanupRequest(req);
    const body = req.body;
    const fleetName = body.custom_fleet;
    const userId = body.ext_user_username;
    const callerConsumerKey = body.oauth_consumer_key;

    const primarySecret = await this._retrieveSecret('ltiConsumerSecretPrimary');
    const primaryConsumerKey = primarySecret.ltiConsumerKey;
    const primaryConsumerSecret = primarySecret.ltiConsumerSecret;

    const secondarySecret = await this._retrieveSecret('ltiConsumerSecretSecondary');
    const secondaryConsumerKey = secondarySecret.ltiConsumerKey;
    const secondaryConsumerSecret = secondarySecret.ltiConsumerSecret;

    let provider;

    if (callerConsumerKey === primaryConsumerKey) {
      provider = new lti.Provider(primaryConsumerKey, primaryConsumerSecret);
    } else if (callerConsumerKey === secondaryConsumerKey) {
      provider = new lti.Provider(secondaryConsumerKey, secondaryConsumerSecret);
    } else {
      throw new Error('Invalid consumer key');
    }

    return new Promise((resolve, reject) => {
      provider.valid_request(req, (err, isValid) => {
        if (err) {
          reject(err);
        }

        if (isValid) {
          resolve(this._getFleetLink({ fleetName, userId }));
        }
      });
    });
  }

  async _getFleetLink({ fleetName, userId }) {
    const params = {
      FleetName: fleetName,
      StackName: fleetName,
      UserId: userId.substring(0, 32),
    };
    const [aws] = await this.service(['aws']);
    const appstream = new aws.sdk.AppStream();
    const res = await appstream.createStreamingURL(params).promise();
    return { link: res.StreamingURL, expires: res.Expires };
  }

  async _retrieveSecret(keyName) {
    const aws = await this.service('aws');
    const sm = new aws.sdk.SecretsManager({ apiVersion: '2017-10-17' });
    const secretId = this.settings.get(settingKeys[keyName]);
    const result = await sm.getSecretValue({ SecretId: secretId }).promise();
    return JSON.parse(result.SecretString);
  }

  _cleanupRequest(req) {
    // API Gateway modifies URLs in the request when it forwards them to the handler.
    // The original values must be reconstructed or the signatures won't match.
    const protocol = req.connection.encrypted ? 'https' : 'http';

    const { context, headers } = req;
    req.url = `${protocol}://${headers.host}/${context.stage}${context.resourcePath}`;
    req.originalUrl = `${protocol}://${headers.host}/${context.stage}${context.resourcePath}`;
  }
}

export default LTIService;
