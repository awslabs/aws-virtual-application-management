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

import i18n from 'roddeh-i18n';

import keys from '../../../../vam-ui-i18n/dist';

const instanceTypes = [
  'stream.standard.medium',
  'stream.standard.large',
  'stream.compute.large',
  'stream.compute.xlarge',
  'stream.compute.2xlarge',
  'stream.compute.4xlarge',
  'stream.compute.8xlarge',
  'stream.memory.large',
  'stream.memory.xlarge',
  'stream.memory.2xlarge',
  'stream.memory.4xlarge',
  'stream.memory.8xlarge',
  'stream.memory.z1d.large',
  'stream.memory.z1d.xlarge',
  'stream.memory.z1d.2xlarge',
  'stream.memory.z1d.3xlarge',
  'stream.memory.z1d.6xlarge',
  'stream.memory.z1d.12xlarge',
  'stream.graphics-design.large',
  'stream.graphics-design.xlarge',
  'stream.graphics-design.2xlarge',
  'stream.graphics-design.4xlarge',
  'stream.graphics-desktop.2xlarge',
  'stream.graphics.g4dn.xlarge',
  'stream.graphics.g4dn.2xlarge',
  'stream.graphics.g4dn.4xlarge',
  'stream.graphics.g4dn.8xlarge',
  'stream.graphics.g4dn.12xlarge',
  'stream.graphics.g4dn.16xlarge',
  'stream.graphics-pro.4xlarge',
  'stream.graphics-pro.8xlarge',
  'stream.graphics-pro.16xlarge',
];

const getInstanceTypes = () => {
  const instTypes = instanceTypes.map(inst => {
    // eslint-disable-next-line consistent-return
    let text = (() => {
      // eslint-disable-next-line default-case
      switch (inst.split('.')[1]) {
        case 'standard':
          return i18n(keys.STANDARD);
        case 'compute':
          return i18n(keys.COMPUTE_OPTIMIZED);
        case 'memory':
          return i18n(keys.MEMORY_OPTIMIZED);
        case 'graphics':
        case 'graphics-design':
        case 'graphics-desktop':
        case 'graphics-pro':
          return i18n(keys.GRAPHICS_OPTIMIZED);
      }
    })();
    text += `  -  ${inst}`;
    return {
      key: inst,
      value: inst,
      text,
    };
  });
  return instTypes;
};

export default getInstanceTypes;
