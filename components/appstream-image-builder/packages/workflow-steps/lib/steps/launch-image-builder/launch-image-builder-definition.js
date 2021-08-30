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
  id: 'st-launch-image-builder',
  v: 7,
  title: 'Launch Image Builder',
  desc: 'Launch Image Builder',
  skippable: false,
  hidden: true,
  inputManifest: {
    sections: [
      {
        title: 'Configuration',
        children: [
          {
            name: 'dapEnabled',
            type: 'yesNoInput',
            title: 'Whether to enable dynamic catalogs',
            desc:
              "If enabled, once you've created a fleet from this image you will have to create a dynamic catalog to configure application provisioning.\n",
          },
          {
            name: 'instanceType',
            type: 'stringInput',
            title: 'instanceType of the Image Builder',
            desc: 'The instanceType of the Image Builder\n',
          },
        ],
      },
    ],
  },
};
