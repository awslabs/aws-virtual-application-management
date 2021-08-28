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

const { CollectionResourceNode } = require('@aws-ee/api-testing-framework');
const { ApplicationNode } = require('./appstream-application');

class ApplicationsNode extends CollectionResourceNode {
  constructor({ clientSession }) {
    super({
      clientSession,
      type: 'applications',
      childType: 'application',
    });
    this.api = '/api/appstream-applications';
  }

  application(id) {
    return new ApplicationNode({ clientSession: this.clientSession, id, parent: this });
  }
}

// register the top-level resource (do not call for children!)
async function registerResources({ clientSession, registry }) {
  const node = new ApplicationsNode({ clientSession });
  registry.set('applications', node);
}

module.exports = { registerResources, ApplicationsNode };
