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
import keys from '../../../vam-api-i18n/dist';

const { runAndCatch } = require('@aws-ee/base-services/dist/helpers/utils');
const AppstreamAuthzService = require('./appstream-authz-service');
const createDynamicCatalogSchema = require('./schema/create-dynamic-catalog');

const settingKeys = {
  dapConfigBucketName: 'dapConfigBucketName',
  tableName: 'dbDynamicCatalogs',
  installerHostWorkBucketName: 'installerHostWorkBucketName',
};

const IMPLICIT_CATALOG_PREFIX = 'magic||||';
const TARGET_TYPE = 'DYNAMIC_CATALOG';

class DynamicCatalogService extends Service {
  constructor() {
    super();
    this.dependency([
      'aws',
      'jsonSchemaValidationService',
      'appstreamUtilService',
      's3Service',
      'dbService',
      'authorizationService',
      'appstreamAuthzService',
      'groupAccessService',
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

  /**
   * Returns dynamic catalogs
   *
   * @param requestContext The request context object containing principal (caller) information.
   * The principal's identifier object is expected to be available as "requestContext.principalIdentifier"
   * @returns {Promise<Array|*[]>}
   */
  async list(requestContext) {
    await this.assertAuthorized(requestContext, { action: AppstreamAuthzService.LIST_DYNAMIC_CATALOGS }, {});

    // TODO - Allow for pagination
    const dbRows = await this._scanner()
      .limit(1000)
      .scan();

    const result = await Promise.all(dbRows.map(o => this._fromDbToDataObject(o)));
    const [appstreamUtilService] = await this.service(['appstreamUtilService']);

    const bucket = this.settings.get(settingKeys.installerHostWorkBucketName);
    await Promise.all(
      result.map(async o => {
        o.applications = await appstreamUtilService.decorateApplications(o.applications, bucket);
      }),
    );
    await Promise.all(
      result.map(o => {
        return this._loadDynamicCatalogGroupAccess(requestContext, o);
      }),
    );
    return result;
  }

  async _loadDynamicCatalogGroupAccess(requestContext, dynCat) {
    const [groupAccessService] = await this.service(['groupAccessService']);
    const groups = await groupAccessService.find(requestContext, {
      targetType: TARGET_TYPE,
      targetId: dynCat.id,
    });
    dynCat.sharedGroups = groups.map(group => {
      return { id: group.groupId, name: group.groupName };
    });
  }

  async createDynamicCatalog(requestContext, { dynamicCatalogName, fleet, applications }) {
    const [appstreamUtilService, validationService] = await this.service([
      'appstreamUtilService',
      'jsonSchemaValidationService',
    ]);

    const id = dynamicCatalogName;
    const params = { id, fleet, applications };
    await validationService.ensureValid(params, createDynamicCatalogSchema);

    // magic dc is an initial catalog created by the system. no specific user access level required
    if (!id.startsWith(IMPLICIT_CATALOG_PREFIX)) {
      const parentFleet = { name: fleet };
      await appstreamUtilService.loadFleetGroupAccess(requestContext, parentFleet);
      await this.assertAuthorized(
        requestContext,
        { action: AppstreamAuthzService.CREATE_DYNAMIC_CATALOG },
        parentFleet,
      );

      const image = await appstreamUtilService.getFleetImage(requestContext, { fleetName: fleet });
      if (!image.dapEnabled) {
        throw this.boom.badRequest(requestContext.i18n(keys.INVALID_DYNAMIC_CATALOG_FLEET, { fleet }), true);
      }
    }

    params.applications = params.applications.map(decodeURI);
    // Save a record in DDB
    const by = _.get(requestContext, 'principalIdentifier.uid');
    const dbObject = this.fromRawToDbObject(params, { rev: 0, createdBy: by, updatedBy: by });
    await runAndCatch(
      async () => {
        return this._updater()
          .condition('attribute_not_exists(id)') // Error if already exists
          .key({ id })
          .item(dbObject)
          .update();
      },
      async () => {
        throw this.boom.badRequest(requestContext.i18n(keys.EXISTING_DYNAMIC_CATALOG, { id }), true);
      },
    );

    const appInfos = await Promise.all(applications.map(async key => this.fromInfoToDataObject(key)));
    return { id, fleet, applications: appInfos };
  }

  async createDynamicCatalogFile(requestContext, { id }) {
    const [groupAccessService] = await this.service(['groupAccessService']);
    const groups = await groupAccessService.find(requestContext, {
      targetType: TARGET_TYPE,
      targetId: id,
    });

    const dc = await this.mustFind(requestContext, id);
    const aws = await this.service('aws');
    const s3 = new aws.sdk.S3();
    const bucket = this.settings.get(settingKeys.dapConfigBucketName);

    // eslint-disable-next-line no-restricted-syntax
    for (const group of groups) {
      const payload = {
        applications: dc.applications,
      };
      // eslint-disable-next-line no-await-in-loop
      await s3
        .putObject({ Bucket: bucket, Key: `${dc.fleet}-${group.groupId}/${id}`, Body: JSON.stringify(payload) })
        .promise();
    }
  }

  async deleteDynamicCatalog(requestContext, { id }) {
    const [appstreamUtilService] = await this.service(['appstreamUtilService']);

    const dynCat = await this.mustFind(requestContext, id);
    const parentFleet = { name: dynCat.fleet };
    await appstreamUtilService.loadFleetGroupAccess(requestContext, parentFleet);
    await this.assertAuthorized(requestContext, { action: AppstreamAuthzService.DELETE_DYNAMIC_CATALOG }, parentFleet);

    // Revoke all group access
    const [groupAccessService] = await this.service(['groupAccessService']);
    const groups = await groupAccessService.find(requestContext, {
      targetType: TARGET_TYPE,
      targetId: id,
    });

    // eslint-disable-next-line no-restricted-syntax
    for (const group of groups) {
      // eslint-disable-next-line no-await-in-loop
      await this.revokeAccess(requestContext, { id, groupId: group.groupId });
    }

    await runAndCatch(
      async () => {
        return this._deleter()
          .condition('attribute_exists(id)') // yes we need this
          .key({ id })
          .delete();
      },
      async () => {
        throw this.boom.notFound(requestContext.i18n(keys.DYNAMIC_CATALOG_NOT_FOUND, { id }), true);
      },
    );

    return {};
  }

  async find(_requestContext, id, fields = []) {
    const result = await this._getter()
      .key({ id })
      .projection(fields)
      .get();

    return this._fromDbToDataObject(result);
  }

  async mustFind(requestContext, id, fields = []) {
    const result = await this.find(requestContext, id, fields);
    if (!result) throw this.notFoundError(requestContext, id);
    return result;
  }

  async grantAccess(requestContext, { id, groupId, groupName }) {
    const [groupAccessService] = await this.service(['groupAccessService']);
    await groupAccessService.createGroupAccess(requestContext, {
      targetType: TARGET_TYPE,
      targetId: id,
      groupId,
      groupName,
    });
    await this.createDynamicCatalogFile(requestContext, { id });
  }

  async revokeAccess(requestContext, { id, groupId }) {
    const [groupAccessService] = await this.service(['groupAccessService']);
    const groups = await groupAccessService.find(requestContext, { targetType: TARGET_TYPE, targetId: id });
    const deletedGroup = _.find(groups, g => g.groupId === groupId);
    await groupAccessService.deleteGroupAccess(requestContext, {
      targetType: TARGET_TYPE,
      targetId: id,
      groupId,
    });

    const dc = await this.mustFind(requestContext, id);
    const aws = await this.service('aws');
    const s3 = new aws.sdk.S3();
    const bucket = this.settings.get(settingKeys.dapConfigBucketName);

    // clean up any files that are now obsolete
    await s3.deleteObject({ Bucket: bucket, Key: `${dc.fleet}-${deletedGroup.groupName}/${id}` }).promise();

    await this.createDynamicCatalogFile(requestContext, { id });
  }

  fromRawToDbObject(rawObject, overridingProps = {}) {
    const dbObject = { ...rawObject, ...overridingProps };
    return dbObject;
  }

  notFoundError(requestContext, id) {
    throw this.boom.badRequest(requestContext.i18n(keys.DYNAMIC_CATALOG_NOT_FOUND, { id }), true);
  }

  // Do some properties renaming to restore the object that was saved in the database
  async _fromDbToDataObject(rawDb, overridingProps = {}) {
    if (_.isNil(rawDb)) return rawDb; // important, leave this if statement here, otherwise, your update methods won't work correctly
    if (!_.isObject(rawDb)) return rawDb;
    overridingProps.applications = await Promise.all(
      rawDb.applications.map(async key => this.fromInfoToDataObject(key)),
    );
    const dataObject = { ...rawDb, ...overridingProps };
    return dataObject;
  }

  async fromInfoToDataObject(key) {
    const appstreamUtilService = await this.service('appstreamUtilService');
    const appInfo = await appstreamUtilService.getApplicationFromInfo(key);
    return appInfo;
  }

  async getDynamicCatalogFleet(id) {
    const record = await runAndCatch(
      async () => {
        return this._getter()
          .key('id', id)
          .get();
      },
      async () => {
        throw this.boom.badRequest(`Dynamic Catalog with id "${id}" cannot be found`, true);
      },
    );
    return record.fleet;
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

export { DynamicCatalogService, IMPLICIT_CATALOG_PREFIX };
