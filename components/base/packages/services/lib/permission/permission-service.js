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
import { runAndCatch } from '../helpers/utils';
import { allowIfActive, allowIfAdmin } from '../authorization/authorization-utils';
import createSchema from '../schema/create-permission.json';

const getActionResource = ({ action, resource }) => `${action}${resource}`;
const getActionPrincipal = ({ action, principal }) => `${action}${principal}`;

const settingKeys = {
  tableName: 'dbPermissions',
};

class PermissionService extends Service {
  constructor() {
    super();
    this.dependency([
      'jsonSchemaValidationService',
      'authorizationService',
      'dbService',
      'auditWriterService',
      'userService',
      'pluginRegistryService',
    ]);
  }

  async init() {
    await super.init();
    const [dbService] = await this.service(['dbService']);
    const table = this.settings.get(settingKeys.tableName);

    this._getter = () => dbService.helper.getter().table(table);
    this._updater = () => dbService.helper.updater().table(table);
    this._query = () => dbService.helper.query().table(table);
    this._deleter = () => dbService.helper.deleter().table(table);
  }

  /**
   * Find an item in the table querying exactly if the principal has the action for the resource.
   *
   * @param  {Object} requestContext Request context object, as defined in
   * `@aws-ee/base-services-container/lib/request-context`.
   * @param  {Object} findParams
   * @param  {string} findParams.principal A unique identifier for the principal.
   * @param  {string} findParams.resource A unique identifier for the resource.
   * @param  {string} findParams.action A string representing the action (eg. read, admin, write).
   * @param  {string[]} [findParams.fields] The fields to fetch from the item.
   *
   * @returns {Promise<Object|undefined>} The item from the table.
   */
  async find(requestContext, { principal, resource, action, fields = [] }) {
    const actionResource = getActionResource({ action, resource });

    const result = await this._getter()
      .key({ principal, actionResource })
      .projection(fields)
      .get();

    if (result) {
      // ensure that the caller has permissions to retrieve the specified permission
      await this._assertAuthorized(requestContext, { action: 'get', conditions: [allowIfActive] }, result);
    }

    return this._transformResult(this._fromDbToDataObject(result));
  }

  /**
   * Verify if the principal has the permission specified by the action for the resource.
   * If the item is found, then it is returned. Otherwise a not found error is thrown.
   *
   * @param  {Object} requestContext Request context object, as defined in
   * `@aws-ee/base-services-container/lib/request-context`.
   * @param  {Object} verifyParams
   * @param  {string} verifyParams.principal A unique identifier for the principal.
   * @param  {string} verifyParams.resource A unique identifier for the resource.
   * @param  {string} verifyParams.action A string representing the action (eg. read, admin, write).
   * @param  {string[]} [verifyParams.fields] The fields to fetch from the item.
   *
   * @throws {BoomError} With code notFound if the permission was not found.
   * @returns {Promise<Object|undefined>} The item from the table.
   */
  async verifyPrincipalPermission(requestContext, { principal, resource, action, fields = [] }) {
    const result = await this.find(requestContext, {
      principal,
      resource,
      action,
      fields,
    });
    if (!result) throw this.boom.notFound(`principal does not have ${action} access to resource`, true);
    return result;
  }

  /**
   * Verifies if the principals have the permission specified by the action for a batch of resources.
   * An array of resources that the principal has access to is returned. Any principal matching
   * will result in a resource being permitted.
   *
   * @param  {Object} requestContext Request context object, as defined in
   * `@aws-ee/base-services-container/lib/request-context`.
   * @param  {Object} batchVerifyParams
   * @param  {string[]} batchVerifyParams.principals An array of identifiers for the principal.
   * These can represent different entities the underlying principal belongs to.
   * @param  {string[]} batchVerifyParams.resources An array of resource ids to check.
   * @param  {string} [batchVerifyParams.resourcePrefix] Optionally specify the prefix of the resource (eg. operation, dataset)
   * @param  {string} batchVerifyParams.action A string representing the action (eg. read, admin, write).
   * @param  {string[]} [batchVerifyParams.fields] The fields to fetch from the item.
   *
   * @returns {Promise<string[]>} The resource ids that the principal has permission for.
   */
  async batchVerifyPrincipalsPermission(_requestContext, { principals, resources, resourcePrefix = '', action } = {}) {
    let remainingResources = resources;
    let allowedResources = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const principal of principals) {
      // Avoid an error trying to batch get no items
      if (remainingResources.length === 0) {
        // Return the results in the original order
        return _.intersection(resources, allowedResources);
      }

      const results = await this._getter() // eslint-disable-line no-await-in-loop
        .keys(
          resources.map(resource => {
            const actionResource = getActionResource({ action, resource: `${resourcePrefix}${resource}` });

            return {
              principal,
              actionResource,
            };
          }),
        )
        .projection('resourceId')
        .get();

      const allowed = _.map(results, result => result.resourceId.slice(resourcePrefix.length));
      allowedResources = _.uniq(allowedResources.concat(allowed));
      remainingResources = _.difference(remainingResources, allowed);
    }

    // Return the results in the original order
    return _.intersection(resources, allowedResources);
  }

  async create(requestContext, permission) {
    // Ensure that the caller has permissions to create the permission
    // Perform default condition checks to make sure the user is active and is admin
    await this._assertAuthorized(
      requestContext,
      { action: 'create', conditions: [allowIfActive, allowIfAdmin] },
      permission,
    );

    // Validate input
    const [validationService, pluginRegistryService] = await this.service([
      'jsonSchemaValidationService',
      'pluginRegistryService',
    ]);

    await validationService.ensureValid(permission, createSchema);

    const { principal, resource, action } = permission;
    const actionResource = getActionResource({ action, resource });
    const actionPrincipal = getActionPrincipal({ action, principal });

    // For now, we assume that 'createdBy' and 'updatedBy' are always users and not groups
    const by = _.get(requestContext, 'principalIdentifier.uid');

    // Prepare the db object
    const rawDbObject = {
      principal,
      resourceId: resource,
      action,
      actionResource,
      actionPrincipal,
      rev: 0,
      createdBy: by,
      updatedBy: by,
    };

    // Give plugins a chance to contribute to the dbObject
    const dbObject = await pluginRegistryService.visitPlugins(
      'permission',
      'createDbItem',
      {
        payload: rawDbObject,
      },
      { requestContext, container: this.container, permission },
    );

    // Time to save the the db object
    const result = await runAndCatch(
      async () => {
        return this._updater()
          .condition('attribute_not_exists(principal)') // yes we need this
          .key({ principal, actionResource })
          .item(dbObject)
          .update();
      },
      async () => {
        throw this.boom.badRequest(
          `permission for principal ${principal} to ${action} ${resource} already exists`,
          true,
        );
      },
    );

    // Write audit event
    await this.audit(requestContext, { action: 'create-permission', body: result });

    return this._transformResult(result);
  }

  /**
   * Ensures that the principals have the permission specified by the action for resource.
   * This method will not throw if the permission already exists.
   *
   * @param  {Object} requestContext Request context object, as defined in
   * `@aws-ee/base-services-container/lib/request-context`.
   * @param  {Object} ensurePermissionsParams
   * @param  {string[]} ensurePermissionsParams.principals An array of identifiers for the principal.
   * These can represent different entities the underlying principal belongs to.
   * @param  {string} ensurePermissionsParams.resource A unique resource id.
   * @param  {string} ensurePermissionsParams.action A string representing the action (eg. read, admin, write).
   * @param  {string[]} [ensurePermissionsParams.fields] The fields to fetch from the item.
   *
   * @returns {Promise<void>}
   */
  async ensurePermissions(requestContext, { principals, resource, action }) {
    return Promise.all(
      _.map(principals, async principal => {
        await this.create(requestContext, { principal, resource, action }).catch(error => {
          if (!('message' in error && error.message.endsWith('already exists'))) {
            throw error;
          }
        });
      }),
    );
  }

  async delete(requestContext, permission) {
    // ensure that the caller has permissions to delete the permission
    // Perform default condition checks to make sure the user is active and is admin
    await this._assertAuthorized(
      requestContext,
      { action: 'delete', conditions: [allowIfActive, allowIfAdmin] },
      permission,
    );

    const { principal, resource, action } = permission;
    const actionResource = getActionResource({ action, resource });

    // Let plugins contribute to deletion
    const [pluginRegistryService] = await this.service(['pluginRegistryService']);
    await pluginRegistryService.visitPlugins(
      'permission',
      'delete',
      {
        payload: permission,
        // Ensure that all plugins are invoked with the same payload
        pluginInvokerFn: async (pluginPayload, plugin, method, ...args) => {
          await plugin[method](pluginPayload, ...args);
          return pluginPayload;
        },
      },
      { requestContext, container: this.container },
    );

    // Lets now remove the item from the database
    const result = await runAndCatch(
      async () => {
        return this._deleter()
          .condition('attribute_exists(principal)') // yes we need this
          .key({ principal, actionResource })
          .delete();
      },
      async () => {
        throw this.boom.notFound(`permission for principal ${principal} to ${action} ${resource} does not exist`, true);
      },
    );

    // Write audit event
    await this.audit(requestContext, { action: 'delete-permission', body: { ...permission } });

    return result;
  }

  /**
   * Deletes permission for the principals specified by the action for resource.
   *
   * @param  {Object} requestContext Request context object, as defined in
   * `@aws-ee/base-services-container/lib/request-context`.
   * @param  {Object} deletePermissionsParams
   * @param  {string[]} deletePermissionsParams.principals An array of identifiers for the principal.
   * These can represent different entities the underlying principal belongs to.
   * @param  {string} deletePermissionsParams.resource A unique resource id.
   * @param  {string} deletePermissionsParams.action A string representing the action (eg. read, admin, write).
   * @param  {string[]} [deletePermissionsParams.fields] The fields to fetch from the item.
   *
   * @returns {Promise<void>}
   */
  async deletePermissions(requestContext, { principals, resource, action }) {
    return Promise.all(
      _.map(principals, async principal => {
        await this.delete(requestContext, { principal, resource, action });
      }),
    );
  }

  /**
   * List principals that have a particular permission (action) for a resource
   *
   * @param  {Object} requestContext Request context object, as defined in
   * `@aws-ee/base-services-container/lib/request-context`.
   * @param  {Object} listPrincipalsParams
   * @param  {string} [listPrincipalsParams.principalPrefix] Optionally specify the prefix of the principal (user, organization, group).
   * @param  {string[]} listPrincipalsParams.resource The resource id to check.
   * @param  {string} listPrincipalsParams.action A string representing the action (eg. read, admin, write).
   * @param  {string[]} [listPrincipalsParams.fields] The fields to fetch from the item.
   *
   * @returns {Promise<Object[]>} The items representing permission for each matching principal.
   */
  async listPrincipalsWithActionForResource(
    requestContext,
    { resource, principalPrefix = '', action, fields = [] } = {},
  ) {
    await this._assertAuthorized(requestContext, { action: 'get', conditions: [allowIfActive] });

    const results = await this._query()
      .index('Resource')
      .key('resourceId', resource)
      .sortKey('actionPrincipal')
      .begins(`${action}${principalPrefix}`)
      .projection(fields)
      .limit(1000)
      .query();

    return _.map(results, this._transformResult);
  }

  /**
   * List resources for which a principal has a particular permission (action).
   *
   * @param  {Object} requestContext Request context object, as defined in
   * `@aws-ee/base-services-container/lib/request-context`.
   * @param  {Object} listResourcesParams
   * @param  {string} listResourcesParams.principal A unique identifier for the principal.
   * @param  {string} [listResourcesParams.resourcePrefix] Optionally specify the prefix of the resource (eg. operation, dataset)
   * @param  {string} listResourcesParams.action A string representing the action (eg. read, admin, write)
   * @param  {string[]} [listResourcesParams.fields] The fields to fetch from the item
   *
   * @returns {Promise<Object[]>} The items representing permission for each matching principal
   */
  async listResourcesWithActionForPrincipal(
    requestContext,
    { principal, resourcePrefix = '', action, fields = [] } = {},
  ) {
    await this._assertAuthorized(requestContext, { action: 'get', conditions: [allowIfActive] });

    const results = await this._query()
      .key('principal', principal)
      .sortKey('actionResource')
      .begins(`${action}${resourcePrefix}`)
      .projection(fields)
      .limit(1000)
      .query();

    return _.map(results, this._transformResult);
  }

  _transformResult({ action, principal, resourceId: resource }) {
    return { action, principal, resource };
  }

  // Do some properties renaming to restore the object that was saved in the database
  _fromDbToDataObject(rawDb, overridingProps = {}) {
    if (_.isNil(rawDb)) return rawDb; // important, leave this if statement here, otherwise, your update methods won't work correctly
    if (!_.isObject(rawDb)) return rawDb;

    const dataObject = { ...rawDb, ...overridingProps };
    return dataObject;
  }

  async _assertAuthorized(requestContext, { action, conditions }, ...args) {
    const authorizationService = await this.service('authorizationService');

    // The "authorizationService.assertAuthorized" below will evaluate permissions by calling the "conditions" functions first
    // It will then give a chance to all registered plugins (if any) to perform their authorization.
    // The plugins can even override the authorization decision returned by the conditions
    // See "authorizationService.authorize" method for more details
    await authorizationService.assertAuthorized(
      requestContext,
      { extensionPoint: 'permission-authz', action, conditions },
      ...args,
    );
  }
}

export default PermissionService;
