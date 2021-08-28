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
import { allowIfActive, allowIfAdmin } from '@aws-ee/base-services';

class AuthenticationProviderTypeService extends Service {
  constructor() {
    super();
    this.dependency(['dbService', 'pluginRegistryService', 'authorizationService']);
  }

  async init() {
    await super.init();

    const [authorizationService] = await this.service(['authorizationService']);
    this.authorizationService = authorizationService;
  }

  async getAuthenticationProviderTypes(requestContext) {
    await this._assertAuthorized(requestContext, {
      action: 'get',
      conditions: [allowIfActive, allowIfAdmin],
    });

    // Give all plugins a chance in registering their authentication provider types
    // Each plugin will receive the following payload object with the shape {requestContext, container, types}
    const pluginRegistryService = await this.service('pluginRegistryService');

    let result;
    // eslint-disable-next-line no-restricted-syntax
    for (const extensionPoint of ['authentication-provisioner', 'authentication-provider']) {
      // eslint-disable-next-line no-await-in-loop
      result = await pluginRegistryService.visitPlugins(extensionPoint, 'registerProviderTypes', {
        payload: { requestContext, container: this.container, typesSoFar: _.get(result, 'types', []) },
      });
    }

    return _.get(result, 'types', []);
  }

  async getAuthenticationProviderType(requestContext, providerTypeId) {
    const providerTypes = await this.getAuthenticationProviderTypes(requestContext);
    return _.find(providerTypes, { type: providerTypeId });
  }

  async _assertAuthorized(requestContext, { action, conditions }, ...args) {
    await this.authorizationService.assertAuthorized(
      requestContext,
      { extensionPoint: 'authentication-provider-type-service-authz', action, conditions },
      ...args,
    );
  }
}

export default AuthenticationProviderTypeService;
