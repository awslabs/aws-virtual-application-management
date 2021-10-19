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
import jwtDecode from 'jwt-decode';
import { newInvoker } from './authentication-providers/helpers/invoker';

const settingKeys = {
  dbValidTokens: 'dbValidTokens',
};
const validTokenKmsKeyAlias = process.env.VALID_TOKEN_KMS_KEY_ALIAS_ARN;

class TokenSwapperService extends Service {
  constructor() {
    super();
    this.boom.extend(['invalidToken', 403]);
    this.dependency(['dbService', 'authenticationProviderConfigService', 'aws']);
  }

  async init() {
    this.invoke = newInvoker(this.container.find.bind(this.container));
  }

  async swap({ token, uid }) {
    const dbService = await this.service('dbService');
    const dbValidTokens = this.settings.get(settingKeys.dbValidTokens);

    if (!uid) {
      throw this.boom.badRequest('Empty uid', true);
    }
    let payload;
    try {
      payload = jwtDecode(token);
    } catch (error) {
      throw this.boom.invalidToken('Invalid Token', true).cause(error);
    }
    // New token should not be expired
    const ttl = _.get(payload, 'exp', 0);
    if (ttl === 0) {
      throw this.boom.invalidToken('Expired Token', true);
    }
    // If token is the same as the token in the dbValidToken then
    // swap is not required.
    const { isSameToken } = await this.revokeValidToken({ token, uid });
    if (isSameToken) {
      return;
    }
    const aws = await this.service('aws');
    const kms = new aws.sdk.KMS();
    const params = {
      KeyId: validTokenKmsKeyAlias,
      Plaintext: token,
    };
    this.log.info('Encrypt user token');
    const { CiphertextBlob } = await kms.encrypt(params).promise();

    const record = { uid, encryptedToken: CiphertextBlob, ttl };
    await dbService.helper
      .updater()
      .table(dbValidTokens)
      .key({ uid })
      .item(record)
      .update();
  }

  async revokeValidToken({ token, uid }) {
    const dbService = await this.service('dbService');
    const authenticationProviderConfigService = await this.service('authenticationProviderConfigService');
    const dbValidTokens = this.settings.get(settingKeys.dbValidTokens);

    const record = await dbService.helper
      .getter()
      .table(dbValidTokens)
      .key({ uid })
      .get();

    if (!record) {
      return { isSameToken: false };
    }

    const encryptedToken = record.encryptedToken;
    const aws = await this.service('aws');
    const kms = new aws.sdk.KMS();

    const params = {
      CiphertextBlob: encryptedToken,
      KeyId: validTokenKmsKeyAlias,
    };

    this.log.info('Past token is being decrypted');
    const { Plaintext } = await kms.decrypt(params).promise();
    const oldToken = Buffer.from(Plaintext).toString();

    const isSameToken = token === oldToken;
    if (isSameToken) {
      return { isSameToken: true };
    }

    // In the case that a token becomes corrupt or an invalid token has ended up in the valid token db
    // then an error should be thrown.
    let payload;
    try {
      payload = jwtDecode(oldToken);
    } catch (error) {
      throw this.boom.invalidToken('Invalid Revoke Token', true).cause(error);
    }
    const providerId = payload.iss;
    const providerConfig = await authenticationProviderConfigService.getAuthenticationProviderConfig(providerId);

    // WARNING: Must provide a tokenRevokerLocator within the providerConfig
    const tokenRevokerLocator = _.get(providerConfig, 'config.type.config.impl.tokenRevokerLocator');
    if (!tokenRevokerLocator) {
      throw this.boom.badRequest(
        `Error revoking token. The authentication provider with id = '${providerId}' does not support token revocation`,
        false,
      );
    }

    this.log.info('Revoking previous user session');
    // invoke the token revoker and pass the token that needs to be revoked
    try {
      await this.invoke(tokenRevokerLocator, undefined, { token: oldToken }, providerConfig);
    } catch (error) {
      throw this.boom.badRequest('Error trying to revoke token', false).cause(error);
    }

    this.log.info('Previous user session succesfully revoked');
    return { isSameToken: false };
  }
}

export default TokenSwapperService;
