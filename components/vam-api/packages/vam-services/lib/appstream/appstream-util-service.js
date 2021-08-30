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
import keys from '../../../vam-api-i18n/dist';

const path = require('path');

const AppstreamAuthzService = require('./appstream-authz-service');

const settingKeys = {
  applicationRepoBucketName: 'applicationRepoBucketName',
  installerHostWorkBucketName: 'installerHostWorkBucketName',
  tableName: 'dbAppstreamImages',
};

const TARGET_TYPE = 'FLEET';

const APP_INFO_FILE = 'info.json';
const APPLICATIONS_PATH = 'applications';
const IMAGE_APPLICATIONS_PATH = 'image_applications';

const getIconUrl = (key, prefix) => {
  const { repoType, displayName, version } = decodeRepoPath(key);
  return `${prefix}/${repoType}/${displayName}/${version}/icon.png`;
};

const decodeRepoPath = pth => {
  const [_applications, repoType, displayName, version] = pth.split('/');
  return { repoType, displayName, version };
};

const applicationFromInfo = async (s3Service, bucket, key) => {
  const appInfo = JSON.parse(await s3Service.getTextObject(bucket, key));
  const { displayName, version } = decodeRepoPath(key);
  appInfo.applicationDisplayName = displayName;
  appInfo.infoDir = path.dirname(key);
  appInfo.infoPath = key;
  appInfo.applicationVersion = version;
  return appInfo;
};

class AppstreamUtilService extends Service {
  constructor() {
    super();
    this.dependency([
      'aws',
      'authorizationService',
      's3Service',
      'dbService',
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

    // A private authorization condition function that just delegates to the environmentAuthzService
    this._allowAuthorized = (requestContext, { resource, action, effect, reason }, ...args) =>
      appstreamAuthzService.authorize(requestContext, { resource, action, effect, reason }, ...args);
  }

  async decorateApplications(applications, bucket) {
    const [s3Service] = await this.service(['s3Service']);
    const icons = applications.map(app => {
      return { bucket, key: app.iconUrl };
    });
    const signed = await s3Service.sign({ files: icons });

    const byKey = {};
    signed.forEach(s => {
      byKey[s.key] = s.signedUrl;
    });
    applications.forEach(app => {
      app.iconUrl = byKey[app.iconUrl];
    });

    // eslint-disable-next-line no-restricted-syntax
    for (const application of applications) {
      // eslint-disable-next-line no-await-in-loop
      const info = await s3Service.getTextObject(bucket, application.infoPath);
      const json = JSON.parse(info);
      application.preinstalled = json.preinstalled || false;
    }

    return applications;
  }

  async loadFleetGroupAccess(requestContext, fleet) {
    const [groupAccessService] = await this.service(['groupAccessService']);
    const groups = await groupAccessService.find(requestContext, {
      targetType: TARGET_TYPE,
      targetId: fleet.name,
    });
    fleet.sharedGroups = groups.map(group => {
      return { id: group.groupId, name: group.groupName };
    });
  }

  async getApplicationFromInfo(key) {
    const bucket = this.settings.get(settingKeys.installerHostWorkBucketName);
    const [s3Service] = await this.service(['s3Service']);
    const appInfo = await applicationFromInfo(s3Service, bucket, key);
    return {
      id: appInfo.applicationName,
      name: appInfo.applicationName,
      displayName: appInfo.applicationDisplayName,
      infoPath: appInfo.infoPath,
      iconUrl: getIconUrl(key, IMAGE_APPLICATIONS_PATH),
    };
  }

  async listApplications(requestContext) {
    await this.assertAuthorized(requestContext, { action: AppstreamAuthzService.LIST_APPLICATIONS }, {});
    const [s3Service] = await this.service(['s3Service']);
    const bucket = this.settings.get(settingKeys.applicationRepoBucketName);
    const result = await s3Service.listObjects({
      bucket,
      prefix: APPLICATIONS_PATH,
    });
    const applications = result
      .filter(app => app.filename === APP_INFO_FILE)
      .map(o => {
        const infoPath = path.join(APPLICATIONS_PATH, o.fullPath);
        const { repoType, displayName, version } = decodeRepoPath(infoPath);
        return {
          id: o.key,
          repoType,
          displayName,
          name: displayName,
          version,
          iconUrl: getIconUrl(infoPath, APPLICATIONS_PATH),
          infoPath: o.key,
        };
      });

    const decoratedApplications = await this.decorateApplications(applications, bucket);
    return decoratedApplications;
  }

  async prepareS3Metadata(requestContext, appKeys, imageName) {
    const s3Service = await this.service('s3Service');
    // Make a copy of the Application meta-data to ensure immutability for this particular image.
    const srcBucket = this.settings.get(settingKeys.applicationRepoBucketName);
    const destBucket = this.settings.get(settingKeys.installerHostWorkBucketName);
    const paths = appKeys.map(appKey => {
      appKey = decodeURI(appKey);
      return appKey
        .split('/')
        .slice(0, 4)
        .join('/');
    });

    // Prepare the paths to the Application keys.
    const copiedAppKeys = appKeys.map(appKey =>
      appKey.replace('applications/default', `${IMAGE_APPLICATIONS_PATH}/${imageName}`),
    );

    const applicationObjects = await Promise.all(
      paths.map(prefix => {
        return s3Service.listObjects({ bucket: srcBucket, prefix });
      }),
    );

    await Promise.all(
      _.flatten(applicationObjects).map(o => {
        const key = o.key;
        const from = key;
        const to = `${IMAGE_APPLICATIONS_PATH}/${imageName}/${key
          .split('/')
          .slice(2)
          .join('/')}`;
        const copyParams = {
          Bucket: destBucket,
          CopySource: `/${srcBucket}/${from}`,
          Key: `${to}`,
        };
        return s3Service.api.copyObject(copyParams).promise();
      }),
    );

    return copiedAppKeys;
  }

  async _findImage(_requestContext, id, fields = []) {
    const result = await this._getter()
      .key({ id })
      .projection(fields)
      .get();

    return this.fromDbToDataObject(result);
  }

  async _mustFindImage(requestContext, id, fields = []) {
    const result = await this._findImage(requestContext, id, fields);
    if (!result) throw this._notFoundError(requestContext, id);
    return result;
  }

  // Do some properties renaming to restore the object that was saved in the database
  fromDbToDataObject(rawDb, overridingProps = {}) {
    if (_.isNil(rawDb)) return rawDb; // important, leave this if statement here, otherwise, your update methods won't work correctly
    if (!_.isObject(rawDb)) return rawDb;

    const dataObject = { ...rawDb, ...overridingProps };
    return dataObject;
  }

  async getFleetImage(requestContext, { fleetName }) {
    const fleet = await this.getFleet(requestContext, { fleetName });
    return this._findImage(requestContext, fleet.imageName);
  }

  async getFleet(requestContext, { fleetName }) {
    await this.assertAuthorized(requestContext, { action: AppstreamAuthzService.GET_FLEET });
    const fleets = await this.listFleets(requestContext);
    const fleet = _.find(fleets, f => f.name === fleetName);
    if (!fleet) {
      throw this.boom.notFound(requestContext.i18n(keys.FLEET_NOT_FOUND, { fleetName }), true);
    }
    return fleet;
  }

  async listFleets(requestContext) {
    await this.assertAuthorized(requestContext, { action: AppstreamAuthzService.LIST_FLEETS });
    const [aws] = await this.service(['aws']);
    const appstream = new aws.sdk.AppStream();
    const res = await appstream.describeFleets().promise();

    // Fleets can potentially be created outside the solution.
    // Providing the fleet was created with an image that was created WITHIN the solution, keep it.
    // Otherwise, filter it out.
    const imageRows = await this._scanner()
      .limit(1000)
      .projection('id')
      .scan();
    const imageMap = {};
    imageRows.forEach(row => {
      imageMap[row.id] = true;
    });
    const filtered = res.Fleets.filter(f => imageMap[f.ImageName]);

    const fleets = filtered.map(this._toFleet);
    await Promise.all(
      fleets.map(f => {
        return this.loadFleetGroupAccess(requestContext, f);
      }),
    );
    return fleets;
  }

  _toFleet(fleet) {
    const capacityStatus = fleet.ComputeCapacityStatus;

    const f = {
      name: fleet.Name,
      displayName: fleet.DisplayName,
      imageName: fleet.ImageName,
      state: fleet.State,
      instanceType: fleet.InstanceType,
      fleetType: fleet.FleetType,
      maxUserDurationInSeconds: fleet.MaxUserDurationInSeconds,
      disconnectTimeoutInSeconds: fleet.DisconnectTimeoutInSeconds,
      idleDisconnectTimeoutInSeconds: fleet.IdleDisconnectTimeoutInSeconds,
      createdTime: fleet.CreatedTime,
      computeCapacityStatus: {
        desired: capacityStatus.Desired,
        running: capacityStatus.Running,
        inUse: capacityStatus.InUse,
        available: capacityStatus.Available,
      },
    };

    const dji = fleet.DomainJoinInfo;
    if (dji) {
      f.domainJoinInfo = {
        directoryName: dji.DirectoryName,
        organizationalUnitDistinguishedName: dji.OrganizationalUnitDistinguishedName,
      };
    }

    return f;
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

export { IMAGE_APPLICATIONS_PATH, AppstreamUtilService, applicationFromInfo };
