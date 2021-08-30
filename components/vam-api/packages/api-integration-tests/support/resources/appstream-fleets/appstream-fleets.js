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
const { FleetNode } = require('./appstream-fleet');
const { settingKeys, getSetting } = require('../../helpers/get-setting');

class FleetsNode extends CollectionResourceNode {
  constructor({ clientSession }) {
    super({
      clientSession,
      type: 'fleets',
      childType: 'fleet',
      childIdProp: 'fleet.name',
    });
    this.api = '/api/appstream-fleets';
  }

  fleet(name) {
    return new FleetNode({ clientSession: this.clientSession, id: name, parent: this });
  }

  defaults(fleet = {}) {
    const gen = this.setup.gen;
    const fleetName = fleet.fleetName || gen.fleetName();
    const imageName = fleet.imageName || getSetting(this.setup, settingKeys.defaultTestImage);
    return {
      fleetName,
      imageName,
      instanceType: 'stream.standard.medium',
      fleetType: 'ALWAYS_ON',
      streamView: 'DESKTOP',
      maxUserDurationInMinutes: 60,
      disconnectTimeoutInMinutes: 15,
      idleDisconnectTimeoutInMinutes: 15,
      desiredCapacity: 1,
    };
  }
}

// register the top-level resource (do not call for children!)
async function registerResources({ clientSession, registry }) {
  const node = new FleetsNode({ clientSession });
  registry.set('fleets', node);
}

module.exports = { registerResources, FleetsNode };
