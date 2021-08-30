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
const { DynamicCatalogNode } = require('./dynamic-catalog');
const { settingKeys, getSetting } = require('../../helpers/get-setting');

class DynamicCatalogsNode extends CollectionResourceNode {
  constructor({ clientSession }) {
    super({
      clientSession,
      type: 'dynamicCatalogs',
      childType: 'dynamicCatalog',
    });
    this.api = '/api/dynamic-catalogs';
  }

  dynamicCatalog(id) {
    return new DynamicCatalogNode({ clientSession: this.clientSession, id, parent: this });
  }

  defaults(catalog = {}) {
    const gen = this.setup.gen;
    const fleetName = catalog.fleetName || getSetting(this.setup, settingKeys.defaultTestFleet);
    const dynamicCatalogName = catalog.dynamicCatalogName || gen.dynamicCatalogName;
    const applications = catalog.applications || ['applications/default/Google Chrome/85.0.4183.102/info.json'];
    return {
      dynamicCatalogName,
      fleetName,
      applications,
    };
  }
}

// register the top-level resource (do not call for children!)
async function registerResources({ clientSession, registry }) {
  const node = new DynamicCatalogsNode({ clientSession });
  registry.set('dynamicCatalogs', node);
}

module.exports = { registerResources, DynamicCatalogsNode };
