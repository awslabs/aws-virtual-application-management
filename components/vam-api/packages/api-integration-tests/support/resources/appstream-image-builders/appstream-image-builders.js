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
const { ImageBuilderNode } = require('./appstream-image-builder');

class ImageBuildersNode extends CollectionResourceNode {
  constructor({ clientSession }) {
    super({
      clientSession,
      type: 'imageBuilders',
      childType: 'imageBuilder',
    });
    this.api = '/api/appstream-image-builders';
  }

  imageBuilder(id) {
    return new ImageBuilderNode({ clientSession: this.clientSession, id, parent: this });
  }
}

// register the top-level resource (do not call for children!)
async function registerResources({ clientSession, registry }) {
  const node = new ImageBuildersNode({ clientSession });
  registry.set('imageBuilders', node);
}

module.exports = { registerResources, ImageBuilderNode };
