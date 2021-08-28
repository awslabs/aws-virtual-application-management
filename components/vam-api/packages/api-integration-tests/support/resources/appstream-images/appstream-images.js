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
const { ImageNode } = require('./appstream-image');

class ImagesNode extends CollectionResourceNode {
  constructor({ clientSession }) {
    super({
      clientSession,
      type: 'images',
      childType: 'image',
      childIdProp: 'name',
    });
    this.api = '/api/appstream-images';
  }

  image(name) {
    return new ImageNode({ clientSession: this.clientSession, id: name, parent: this });
  }

  defaults(image = {}) {
    const gen = this.setup.gen;
    const imageName = image.imageName || gen.imageName();
    return {
      imageName,
      applications: ['applications/default/Google Chrome/85.0.4183.102/info.json'],
      dapEnabled: false,
      snapshotImage: true,
      deleteImageBuilder: true,
      instanceType: 'stream.standard.medium',
      imageBuilderID: '',
    };
  }
}

// register the top-level resource (do not call for children!)
async function registerResources({ clientSession, registry }) {
  const node = new ImagesNode({ clientSession });
  registry.set('images', node);
}

module.exports = { registerResources, ImagesNode };
