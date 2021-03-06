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

const _ = require('lodash');
const { ResourceNode } = require('@aws-ee/api-testing-framework');

const { deleteUser } = require('../../complex/delete-user');

class UserNode extends ResourceNode {
  constructor({ clientSession, id, parent }) {
    super({
      clientSession,
      type: 'user',
      id,
      parent,
    });

    // The user resource node is mounted on two different namespaces: /api/users and /api/user
    // The /api/user resource is meant to represent the current user.  This file represents the
    // resource node for /api/users/<user>.
    if (_.isEmpty(parent)) throw Error('A parent resource was not provided to resource type [user]');
  }

  async cleanup() {
    await deleteUser({ aws: this.setup.aws, id: this.id });
  }

  // ************************ Helpers methods ************************

  async updatePassword(password) {
    return this.doCall(async () => this.axiosClient.put(`${this.api}/password`, { password }));
  }
}

// IMPORTANT: since this is a child resource, it should NOT have registerResources() function
module.exports = { UserNode };
