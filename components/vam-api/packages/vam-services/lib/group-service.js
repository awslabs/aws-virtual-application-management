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

// list: Group objects

import { awsHelper } from '@aws-ee/base-script-utils';
import { Service } from '@aws-ee/base-services-container';
import ActiveDirectory from 'activedirectory';

const GroupAuthzService = require('./group-authz-service');

const settingKeys = {
  adDomain: 'adDomain',
  imageBuilderADPrimary: 'imageBuilderADPrimary',
  imageBuilderADSecondary: 'imageBuilderADSecondary',
  imageBuilderADCredentialsArn: 'imageBuilderADCredentialsArn',
};

class GroupService extends Service {
  constructor() {
    super();
    this.dependency(['aws', 'authorizationService', 'groupAuthzService']);
  }

  async init() {
    await super.init();
    const [groupAuthzService] = await this.service(['groupAuthzService']);

    // A private authorization condition function that just delegates to the environmentAuthzService
    this._allowAuthorized = (requestContext, { resource, action, effect, reason }, ...args) =>
      groupAuthzService.authorize(requestContext, { resource, action, effect, reason }, ...args);
  }

  /**
   * Returns groups
   *
   * @returns {Promise<Array|*[]>}
   */
  async list(requestContext) {
    await this.assertAuthorized(requestContext, { action: GroupAuthzService.LIST_GROUPS }, {});
    const response = await this._performLDAPQuery({
      method: 'find',
      query: '(&(objectClass=GROUP)(cn=*))',
    });

    return response.groups.map(group => {
      return { dn: group.dn, name: group.cn };
    });
  }

  /**
   * Returns groups for user
   *
   * @returns {Promise<Array|*[]>}
   */
  async listForUser(_requestContext) {
    // await this.assertAuthorized(requestContext, { action: GroupAuthzService.LIST_GROUPS }, {});

    // FIXME we need a way to enforce federated logins so that solution users
    // always map directly to the users we can find via AD lookups directly.
    // Until then, and in light of workflows requiring Admin users anyway,
    // we will fall back (in appstream-authz-service) to just checking for Admin
    // status.

    // if (requestContext.principal.authenticationProviderId !== 'internal') {
    //   console.log(requestContext.principal);
    //   const username = requestContext.principal.username.split('@')[0];

    //   const response = await this._performLDAPQuery({
    //     method: 'getGroupMembershipForUser',
    //     query: username,
    //   });

    //   return response.map(group => {
    //     return { dn: group.dn, name: group.cn };
    //   });
    // }

    return [];
  }

  async _performLDAPQuery({ method, query }) {
    const primary = this.settings.get(settingKeys.imageBuilderADPrimary);
    const adDomain = this.settings.get(settingKeys.adDomain);
    const imageBuilderADCredentialsArn = this.settings.get(settingKeys.imageBuilderADCredentialsArn);

    const smClient = awsHelper.getClientSdk({ clientName: 'SecretsManager' });
    const secret = await smClient.getSecretValue({ SecretId: imageBuilderADCredentialsArn }).promise();
    const username = JSON.parse(secret.SecretString).username;
    const password = JSON.parse(secret.SecretString).password;

    const ad = this._mkAd({ ip: primary, domain: adDomain, username, password });

    return new Promise((resolve, reject) => {
      // eslint-disable-next-line func-names
      ad[method](query, function(err, response) {
        if (err) reject(err);
        resolve(response);
      });
    });
  }

  _mkAd({ ip, domain, username, password }) {
    const config = {
      url: `ldap://${ip}/`,
      baseDN: `dc=${domain},dc=com`,
      username,
      password,
    };
    return ActiveDirectory(config);
  }

  async assertAuthorized(requestContext, { action }, ...args) {
    const authorizationService = await this.service('authorizationService');
    const conditions = [this._allowAuthorized];

    // The "authorizationService.assertAuthorized" below will evaluate permissions by calling the "conditions" functions first
    // It will then give a chance to all registered plugins (if any) to perform their authorization.
    // The plugins can even override the authorization decision returned by the conditions
    // See "authorizationService.authorize" method for more details
    await authorizationService.assertAuthorized(
      requestContext,
      { extensionPoint: 'appstream-authz', action, conditions },
      ...args,
    );
  }
}

export default GroupService;
