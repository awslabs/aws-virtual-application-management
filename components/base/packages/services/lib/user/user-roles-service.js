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

import _ from 'lodash';
import { Service } from '@aws-ee/base-services-container';
import { allowIfActive, allowIfAdmin, isAdmin } from '../authorization/authorization-utils';
import { runAndCatch } from '../helpers/utils';

import UserRoleEntityTypeMap from './constants/user-role-entity-types';

import createSchema from '../schema/create-user-role.json';
import updateSchema from '../schema/update-user-role.json';

const settingKeys = {
  tableName: 'dbUserRoles',
};

const byEntityTypeIndexName = 'ByEntityType';

class UserRolesService extends Service {
  constructor() {
    super();
    this.dependency(['jsonSchemaValidationService', 'dbService', 'authorizationService', 'auditWriterService']);
  }

  async init() {
    await super.init();
    const [dbService] = await this.service(['dbService']);
    const table = this.settings.get(settingKeys.tableName);

    this._getter = () => dbService.helper.getter().table(table);
    this._updater = () => dbService.helper.updater().table(table);
    this._query = () => dbService.helper.query().table(table);
    this._deleter = () => dbService.helper.deleter().table(table);
    this._scanner = () => dbService.helper.scanner().table(table);
  }

  async find(_requestContext, { id, fields = [] }) {
    const result = await this._getter()
      .key({ id, entityType: UserRoleEntityTypeMap.ROLE })
      .projection(fields)
      .get();

    return this._fromDbToDataObject(result);
  }

  async mustFind(requestContext, { id, fields = [] }) {
    const result = await this.find(requestContext, { id, fields });
    if (!result) throw this.boom.notFound(`user role with id "${id}" does not exist`, true);
    return result;
  }

  async create(requestContext, userRole) {
    // ensure that the caller has permissions to create the user role
    // Perform default condition checks to make sure the user is active and is admin
    await this.assertAuthorized(
      requestContext,
      { action: 'create', conditions: [allowIfActive, allowIfAdmin] },
      userRole,
    );

    // Validate input
    const [validationService] = await this.service(['jsonSchemaValidationService']);
    await validationService.ensureValid(userRole, createSchema);

    // For now, we assume that 'createdBy' and 'updatedBy' are always users and not groups
    const by = _.get(requestContext, 'principalIdentifier.uid');
    const { id } = userRole;

    // Prepare the db object
    const dbObject = this._fromRawToDbObject(userRole, {
      rev: 0,
      createdBy: by,
      updatedBy: by,
    });

    // Time to save the the db object
    const result = await runAndCatch(
      async () => {
        return this._updater()
          .condition('attribute_not_exists(id)') // yes we need this
          .key({ id, entityType: UserRoleEntityTypeMap.ROLE })
          .item(dbObject)
          .update();
      },
      async () => {
        throw this.boom.badRequest(`user role with id "${id}" already exists`, true);
      },
    );

    // Write audit event
    await this.audit(requestContext, { action: 'create-user-role', body: result });

    return result;
  }

  async update(requestContext, rawData) {
    // ensure that the caller has permissions to update the user role information
    // Perform default condition checks to make sure the user is active and is admin
    await this.assertAuthorized(
      requestContext,
      { action: 'update', conditions: [allowIfActive, allowIfAdmin] },
      rawData,
    );

    // Validate input
    const [validationService] = await this.service(['jsonSchemaValidationService']);
    await validationService.ensureValid(rawData, updateSchema);

    // For now, we assume that 'updatedBy' is always a user and not a group
    const by = _.get(requestContext, 'principalIdentifier.uid');
    const { id, rev } = rawData;

    // Prepare the db object
    const dbObject = _.omit(this._fromRawToDbObject(rawData, { updatedBy: by }), ['rev']);

    // Time to save the the db object
    const result = await runAndCatch(
      async () => {
        return this._updater()
          .condition('attribute_exists(id)') // yes we need this
          .key({ id, entityType: UserRoleEntityTypeMap.ROLE })
          .rev(rev)
          .item(dbObject)
          .update();
      },
      async () => {
        // There are two scenarios here:
        // 1 - The userRole does not exist
        // 2 - The "rev" does not match
        // We will display the appropriate error message accordingly
        const existing = await this.find(requestContext, { id, fields: ['id', 'updatedBy'] });
        if (existing) {
          throw this.boom.badRequest(
            `user role information changed by "${existing.updatedBy}" just before your request is processed, please try again`,
            true,
          );
        }
        throw this.boom.notFound(`user role with id "${id}" does not exist`, true);
      },
    );

    // Write audit event
    await this.audit(requestContext, { action: 'update-user-role', body: result });

    return result;
  }

  async delete(requestContext, { id }) {
    // ensure that the caller has permissions to delete the user role
    // Perform default condition checks to make sure the user is active and is admin
    await this.assertAuthorized(
      requestContext,
      { action: 'delete', conditions: [allowIfActive, allowIfAdmin] },
      { id },
    );

    // Lets now remove the item from the database
    const result = await runAndCatch(
      async () => {
        return this._deleter()
          .condition('attribute_exists(id)') // yes we need this
          .key({ id, entityType: UserRoleEntityTypeMap.CAPABILITY })
          .delete();
      },
      async () => {
        throw this.boom.notFound(`user role with id "${id}" does not exist`, true);
      },
    );

    // Write audit event
    await this.audit(requestContext, { action: 'delete-user-role', body: { id } });

    return result;
  }

  async list(requestContext, { maxResults = 1000, nextToken, fields = [] } = {}) {
    await this.assertAuthorized(requestContext, { action: 'list', conditions: [allowIfActive] });

    // Admins can see all roles
    if (isAdmin(requestContext)) {
      const results = await this._query()
        .index(byEntityTypeIndexName)
        .key('entityType', UserRoleEntityTypeMap.ROLE)
        .limit(maxResults)
        .projection(fields)
        .queryPage(nextToken);

      return results;
    }

    // Other users will only see their role
    const userRole = _.get(requestContext, 'principal.userRole');
    const foundRole = await this.mustFind(requestContext, { id: userRole });

    return { items: [foundRole] };
  }

  // Do some properties renaming to prepare the object to be saved in the database
  _fromRawToDbObject(rawObject, overridingProps = {}) {
    const dbObject = { ...rawObject, ...overridingProps };
    return dbObject;
  }

  // Do some properties renaming to restore the object that was saved in the database
  _fromDbToDataObject(rawDb, overridingProps = {}) {
    if (_.isNil(rawDb)) return rawDb; // important, leave this if statement here, otherwise, your update methods won't work correctly
    if (!_.isObject(rawDb)) return rawDb;

    const dataObject = { ...rawDb, ...overridingProps };
    return dataObject;
  }

  async audit(requestContext, auditEvent) {
    const auditWriterService = await this.service('auditWriterService');
    // Calling "writeAndForget" instead of "write" to allow main call to continue without waiting for audit logging
    // and not fail main call if audit writing fails for some reason
    // If the main call also needs to fail in case writing to any audit destination fails then switch to "write" method as follows
    // return auditWriterService.write(requestContext, auditEvent);
    return auditWriterService.writeAndForget(requestContext, auditEvent);
  }

  async assertAuthorized(requestContext, { action, conditions }, ...args) {
    const authorizationService = await this.service('authorizationService');

    // The "authorizationService.assertAuthorized" below will evaluate permissions by calling the "conditions" functions first
    // It will then give a chance to all registered plugins (if any) to perform their authorization.
    // The plugins can even override the authorization decision returned by the conditions
    // See "authorizationService.authorize" method for more details
    await authorizationService.assertAuthorized(
      requestContext,
      { extensionPoint: 'user-role-management-authz', action, conditions },
      ...args,
    );
  }
}

export default UserRolesService;
