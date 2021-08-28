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

// The user resource is mounted on two different namespaces: /api/users and /api/user
// The /api/user resource is meant to represent the current user.  This file represents the
// resource node for /api/user. For the /api/users, see the users.js file under the users folder.
class CurrentUserNode extends ResourceNode {
  constructor({ clientSession }) {
    super({
      clientSession,
      type: 'currentUser',
    });

    this.api = '/api/user';
  }

  // ************************ Helpers methods ************************
}

// IMPORTANT: only define registerResources for top level resource nodes,
// child resource nodes should NOT have this method.
async function registerResources({ clientSession, registry }) {
  const node = new CurrentUserNode({ clientSession });
  registry.set('currentUser', node);
}

module.exports = { registerResources, CurrentUserNode };
