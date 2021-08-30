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

// list: DynamicCatalog objects
// create: from Images, pick applications, create new DynamicCatalog.

import _ from 'lodash';
import { Service } from '@aws-ee/base-services-container';
import { runAndCatch } from '@aws-ee/base-services';
import keys from '../../../vam-api-i18n/dist';
import AppstreamAuthzService from './appstream-authz-service';
import createGroupAccessSchema from './schema/create-group-access';

const settingKeys = {
  tableName: 'dbGroupAccess',
};

class GroupAccessService extends Service {
  constructor() {
    super();
    this.dependency([
      'aws',
      'jsonSchemaValidationService',
      'dbService',
      'authorizationService',
      'appstreamAuthzService',
    ]);
  }

  async init() {
    await super.init();
    const [dbService, appstreamAuthzService] = await this.service(['dbService', 'appstreamAuthzService']);
    const table = this.settings.get(settingKeys.tableName);

    this._getter = () => dbService.helper.getter().table(table);
    this._query = () => dbService.helper.query().table(table);
    this._updater = () => dbService.helper.updater().table(table);
    this._deleter = () => dbService.helper.deleter().table(table);
    this._scanner = () => dbService.helper.scanner().table(table);
    this._allowAuthorized = (requestContext, { resource, action, effect, reason }, ...args) =>
      appstreamAuthzService.authorize(requestContext, { resource, action, effect, reason }, ...args);
  }

  createId(targetType, targetId) {
    return `${targetType}||||${targetId}`;
  }

  async createGroupAccess(requestContext, { targetType, targetId, groupId, groupName }) {
    const [validationService] = await this.service(['jsonSchemaValidationService']);
    const params = { targetType, targetId, groupId, groupName };
    await validationService.ensureValid(params, createGroupAccessSchema);

    const by = _.get(requestContext, 'principalIdentifier.uid');
    const id = this.createId(targetType, targetId);
    const key = { id, groupId };
    const current = await this.find(requestContext, { targetType, targetId });
    await this.assertAuthorized(requestContext, { action: AppstreamAuthzService.GRANT_ACCESS_TO_GROUP }, current);

    const dbObject = this.fromRawToDbObject({ id, groupId, groupName }, { rev: 0, createdBy: by, updatedBy: by });
    await runAndCatch(
      async () => {
        return this._updater()
          .condition('attribute_not_exists(id)') // Error if already exists
          .key(key)
          .item(dbObject)
          .update();
      },
      async () => {
        throw this.boom.badRequest(requestContext.i18n(keys.EXISTING_GROUP_ACCESS, { groupId }), true);
      },
    );
  }

  async deleteGroupAccess(requestContext, { targetType, targetId, groupId }) {
    const current = await this.find(requestContext, { targetType, targetId });
    await this.assertAuthorized(requestContext, { action: AppstreamAuthzService.REVOKE_ACCESS_TO_GROUP }, current);
    const id = this.createId(targetType, targetId);
    const key = { id, groupId };

    await runAndCatch(
      async () => {
        return this._deleter()
          .condition('attribute_exists(id)') // yes we need this
          .key(key)
          .delete();
      },
      async () => {
        throw this.boom.notFound(requestContext.i18n(keys.ERROR_REVOKING_GROUP_ACCESS, { groupId }), true);
      },
    );
  }

  async find(_requestContext, { targetType, targetId }) {
    const id = this.createId(targetType, targetId);
    const result = await this._query()
      .key('id', id)
      .query();
    return result;
  }

  fromRawToDbObject(rawObject, overridingProps = {}) {
    const dbObject = { ...rawObject, ...overridingProps };
    return dbObject;
  }

  notFoundError(requestContext, id) {
    throw this.boom.badRequest(requestContext.i18n(keys.DYNAMIC_CATALOG_NOT_FOUND, { id }), true);
  }

  async assertAuthorized(requestContext, { action }, ...args) {
    const authorizationService = await this.service('authorizationService');
    const conditions = [this._allowAuthorized];

    // The "authorizationService.assertAuthorized" below will evaluate permissions by calling the "conditions" functions first
    // It will then give a chance to all registered plugins (if any) to perform their authorization.
    // The plugins can even override the authorization decision returned by the conditions
    // See "authorizationService.authorize" method for more details
    await authorizationService.assertAuthorized(
      requestContext,
      { extensionPoint: 'appstream-authz', action, conditions },
      ...args,
    );
  }
}

module.exports = GroupAccessService;
