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

import { Service } from '@aws-ee/base-services-container';

class AddAuthProviders extends Service {
  constructor() {
    super();
    this.dependency(['pluginRegistryService']);
  }

  async execute() {
    const pluginRegistryService = await this.service('pluginRegistryService');
    await pluginRegistryService.visitPlugins('authentication-provisioner', 'provisionProvider', {
      payload: this.container,
    });
  }

  async cleanup() {
    const pluginRegistryService = await this.service('pluginRegistryService');
    await pluginRegistryService.visitPlugins('authentication-provisioner', 'teardownProvider', {
      payload: this.container,
    });
  }
}

export default AddAuthProviders;
