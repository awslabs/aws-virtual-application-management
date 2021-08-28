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

// TODO: Find a common place for reusable mocks

class ServicesContainerMock {
  constructor(serviceMap = {}) {
    this.serviceMap = serviceMap;
  }

  register(name, instance) {
    this.serviceMap[name] = instance;
  }

  isRoot() {
    return true;
  }

  find(name) {
    return this.serviceMap[name];
  }

  async initServices() {
    await Promise.all(
      Object.keys(this.serviceMap)
        .filter(key => !!this.serviceMap[key].initService)
        .map(key => this.serviceMap[key].initService(this, { name: key })),
    );
  }
}

export default ServicesContainerMock;
