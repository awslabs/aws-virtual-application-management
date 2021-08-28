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

const { ResourceNode } = require('@aws-ee/api-testing-framework');

const { AuthenticationIdTokensNode } = require('./authentication-id-tokens');
const { AuthenticationProviderTypesNode } = require('./authentication-provider-types');
const { AuthenticationProviderConfigsNode } = require('./authentication-provider-configs');

class AuthenticationNode extends ResourceNode {
  constructor({ clientSession }) {
    super({
      clientSession,
      type: 'authentication',
    });
    this.api = '/api/authentication';
  }

  configs() {
    return new AuthenticationProviderConfigsNode({ clientSession: this.clientSession, parent: this });
  }

  types() {
    return new AuthenticationProviderTypesNode({ clientSession: this.clientSession, parent: this });
  }

  idTokens() {
    return new AuthenticationIdTokensNode({ clientSession: this.clientSession, parent: this });
  }

  async logout() {
    return this.doCall(async () => this.axiosClient.post(`${this.api}/logout`));
  }

  // ************************ Helpers methods ************************
}

// IMPORTANT: only define registerResources for top level resource nodes,
// child resource nodes should NOT have this method.
async function registerResources({ clientSession, registry }) {
  const node = new AuthenticationNode({ clientSession });
  registry.set('authentication', node);
}

module.exports = { registerResources, AuthenticationNode };
