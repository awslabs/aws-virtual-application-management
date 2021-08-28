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

export default {
  id: 'st-wait-for-image-builder',
  v: 6,
  title: 'Take a snapshot of the Image Builder',
  desc: 'Wait until the image builder has finished snapshotting itself into an image.',
  skippable: true,
  hidden: true,
  inputManifest: {
    sections: [
      {
        title: 'Configuration',
        children: [
          {
            name: 'imageBuilderID',
            type: 'stringInput',
            title: 'ID of the image builder we are working on',
            desc: 'ID of current image builder which is used for the ib Name',
          },
          {
            name: 'dapEnabled',
            type: 'yesNoInput',
            title: 'Whether to enable dynamic catalogs',
            desc:
              "If enabled, once you've created a fleet from this image you will have to create a dynamic catalog to configure application provisioning.",
          },
        ],
      },
    ],
  },
};
