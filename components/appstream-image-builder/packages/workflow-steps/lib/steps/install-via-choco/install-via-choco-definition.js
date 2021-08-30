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
  id: 'st-install-via-choco',
  v: 6,
  title: 'Install application via choco',
  desc: 'Install choco packages via an installer host that is able to execute remotely on an image builder instance.\n',
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
            desc: 'ID of current image builder which is used for the ib Name\n',
          },
          {
            name: 'dapEnabled',
            type: 'yesNoInput',
            title: 'Whether to enable dynamic catalogs',
            desc:
              "If enabled, once you've created a fleet from this image you will have to create a dynamic catalog to configure application provisioning.\n",
          },
          {
            name: 'packageName',
            type: 'stringInput',
            title: 'Package name to install',
            desc: 'Currently, this is a choco package.',
          },
          {
            name: 'applicationName',
            type: 'stringInput',
            title: 'Name of the application that is being installed (no spaces)',
            desc: 'The name is used by the AppStream application catalog.',
          },
          {
            name: 'applicationDisplayName',
            type: 'stringInput',
            title: 'Display name of the application that is being installed',
            desc: 'The display name is displayed in the AppStream application catalog.',
          },
          {
            name: 'applicationExePath',
            type: 'stringInput',
            title: 'Path of the application that is being installed',
            desc: 'The exe is the main location of the install software and is used for optimization purposes.',
          },
          {
            name: 'applicationVersion',
            type: 'stringInput',
            title: 'Version of the application that is being installed',
            desc: 'The version, per chocolatey repo, of the software that is being installed',
          },
        ],
      },
    ],
  },
};
