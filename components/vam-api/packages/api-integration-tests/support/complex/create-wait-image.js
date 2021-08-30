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

/* eslint-disable no-constant-condition */
/* eslint-disable no-await-in-loop */
const _ = require('lodash');

// Create an AppStream Image if it does not yet exist.
// Wait for the image to become available.
// Return the image record when available or throw if it will never be available.
async function createWaitImage(adminSession, imageName) {
  // assume the image exists and wait for the image to become available
  while (true) {
    let imgName = imageName;
    let image;
    if (imgName) {
      const images = await adminSession.resources.images.get();
      image = _.find(images, (img) => {
        return img.name === imgName;
      });
      if (!image) {
        image = await adminSession.resources.images.create(
          { imageName },
          {},
          { api: '/api/appstream-images/create', applyDefaults: true },
        );
      }

      imgName = image.name;
    }

    if (image.state === 'AVAILABLE') {
      return image;
    }

    if (image.state === 'FAILED' || image.state === 'DELETING') {
      throw new Error(`'${image.name}' is currently in a '${image.state}' state. It will not become 'AVAILABLE'.`);
    }

    // eslint-disable-next-line no-console
    console.log(`${image.name} currently in ${image.state} state. Waiting...`);
    await new Promise((resolve) => setTimeout(resolve, 15000));
  }
}

module.exports = { createWaitImage };
