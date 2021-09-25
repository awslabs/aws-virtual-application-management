import _ from 'lodash';
import { Service } from '@aws-ee/base-services-container';
import jwtDecode from 'jwt-decode';
import { newInvoker } from './authentication-providers/helpers/invoker';

const settingKeys = {
  dbValidTokens: 'dbValidTokens',
};
class TokenSwapperService extends Service {
  constructor() {
    super();
    this.boom.extend(['invalidToken', 403]);
    this.dependency(['dbService', 'authenticationProviderConfigService']);
  }

  async init() {
    this.invoke = newInvoker(this.container.find.bind(this.container));
  }

  async swap({ token, uid }) {
    const dbService = await this.service('dbService');
    const dbValidTokens = this.settings.get(settingKeys.dbValidTokens);

    const { isSameToken } = await this.revokeValidToken({ token, uid });
    if (isSameToken) {
      return;
    }
    const record = { uid, token };
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

    const oldToken = record.token;
    const isSameToken = token === oldToken;
    if (isSameToken) {
      return { isSameToken: true };
    }

    let payload;
    try {
      payload = jwtDecode(oldToken);
    } catch (error) {
      throw this.boom.invalidToken('Invalid Revoke Token', true).cause(error);
    }
    const providerId = payload.iss;
    const providerConfig = await authenticationProviderConfigService.getAuthenticationProviderConfig(providerId);

    const tokenRevokerLocator = _.get(providerConfig, 'config.type.config.impl.tokenRevokerLocator');
    if (!tokenRevokerLocator) {
      throw this.boom.badRequest(
        `Error revoking token. The authentication provider with id = '${providerId}' does not support token revocation`,
        false,
      );
    }

    // invoke the token revoker and pass the token that needs to be revoked
    try {
      await this.invoke(tokenRevokerLocator, 'requestContext', { token: oldToken }, providerConfig);
    } catch (error) {
      throw this.boom.badRequest(`Error trying to revoke token: ${error}`);
    }
    return { isSameToken: false };
  }
}

export default TokenSwapperService;
