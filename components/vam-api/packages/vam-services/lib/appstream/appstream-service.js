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

const slugify = require('slugify');
const { runAndCatch } = require('@aws-ee/base-services/dist/helpers/utils');
const executeStep = require('./util.js');

const AppstreamAuthzService = require('./appstream-authz-service');
const createImageSchema = require('./schema/create-image');
const imageSharingSchema = require('./schema/image-sharing');
const createFleetSchema = require('./schema/create-fleet');
const { IMPLICIT_CATALOG_PREFIX } = require('./dynamic-catalog-service');

const { applicationFromInfo, IMAGE_APPLICATIONS_PATH } = require('./appstream-util-service');

const settingKeys = {
  installerHostWorkBucketName: 'installerHostWorkBucketName',
  tableName: 'dbAppstreamImages',
  subnet: 'activeDirectoryVPCSubnet',
  appstreamInstanceRoleArn: 'appstreamInstanceRoleArn',
  gsuiteDomains: 'gsuiteDomains',
  embedHosts: 'embedHosts',
  adDomainName: 'adDomainName',
  ou: 'ou',
  adJoined: 'adJoined',
  appstreamImageArn: 'appstreamImageArn',
  namespace: 'namespace',
};

const PROCESSING = 'PROCESSING';
const FAILED = 'FAILED';

const TARGET_TYPE = 'FLEET';

class AppstreamService extends Service {
  constructor() {
    super();
    this.dependency([
      'aws',
      'jsonSchemaValidationService',
      's3Service',
      'stepTemplateService',
      'workflowService',
      'workflowTriggerService',
      'workflowDraftService',
      'workflowInstanceService',
      'dbService',
      'authorizationService',
      'appstreamAuthzService',
      'appstreamUtilService',
      'groupAccessService',
      'dynamicCatalogService',
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

  /**
   * Returns the Private (including shared with other accounts) AppStream Images.
   *
   * @param requestContext The request context object containing principal (caller) information.
   * The principal's identifier object is expected to be available as "requestContext.principalIdentifier"
   * @returns {Promise<Array|*[]>}
   */
  // secured
  async listImages(requestContext) {
    await this.assertAuthorized(requestContext, { action: AppstreamAuthzService.LIST_IMAGES }, {});

    // TODO - Allow for pagination
    const dbRows = await this._scanner()
      .limit(1000)
      .scan();

    const [aws, workflowInstanceService] = await this.service(['aws', 'workflowInstanceService']);
    const appstream = new aws.sdk.AppStream();
    const params = {
      Type: 'PRIVATE',
    };
    // TODO - Allow for pagination
    const res = await appstream.describeImages(params).promise();
    const sharedAccounts = await Promise.all(res.Images.map(img => this._getImageSharing(img.Name)));

    const imageMap = res.Images.reduce((map, img, ind) => {
      map[img.Name] = {
        name: img.Name,
        displayName: img.DisplayName || img.Name,
        arn: img.Arn,
        state: img.State,
        applications: img.Applications.map(app => {
          return {
            id: app.Name,
            name: app.Name,
            displayName: app.DisplayName,
            iconUrl: app.IconURL,
          };
        }),
        visibility: img.Visibility,
        platform: img.Platform,
        createdTime: img.CreatedTime,
        sharedAccounts: sharedAccounts[ind],
      };
      return map;
    }, {});

    const images = await Promise.all(
      dbRows.map(async row => {
        let image = imageMap[row.id];
        if (image) {
          try {
            image = await this._decorateAppstreamImage(row, image);
          } catch (e) {
            this.log.error('Error decorating Image: ', e.message);
            return null;
          }
        } else {
          image = this._createPlaceHolderImage(row);
        }
        // The below assumes that the workflows created for building images will always be of version 1.
        // This is true for now, but if more sophisticated use cases with modified workflows are introduced this will behave erratically.
        const workflowInstances = await workflowInstanceService.list(requestContext, {
          workflowId: row.workflowId,
          workflowVer: 1,
        });
        const wfState = _.get(workflowInstances, [0, 'wfStatus']);
        if (wfState === 'error') {
          image.state = FAILED;
        }
        return image;
      }),
    );
    return images.filter(image => image !== null);
  }

  async listImageBuilders(requestContext) {
    await this.assertAuthorized(requestContext, { action: AppstreamAuthzService.LIST_IMAGE_BUILDERS }, {});
    const [aws] = await this.service(['aws']);
    const appstream = new aws.sdk.AppStream();

    const res = await appstream.describeImageBuilders({}).promise();
    const imageBuilders = res.ImageBuilders.map(({ Name }) => {
      return { name: Name, displayName: Name };
    });
    return imageBuilders;
  }

  _notFoundError(requestContext, id) {
    throw this.boom.badRequest(requestContext.i18n(keys.IMAGE_NOT_FOUND, { id }), true);
  }

  async _decorateAppstreamImage(row, appstreamImage) {
    const { workflowId, instanceId, applications, dapEnabled } = row;
    // recover the s3 info.json path and add to the application entries
    const bucket = this.settings.get(settingKeys.installerHostWorkBucketName);
    const appstreamUtilService = await this.service('appstreamUtilService');
    const appInfos = await Promise.all(applications.map(async key => appstreamUtilService.getApplicationFromInfo(key)));
    const decoratedApplications = await appstreamUtilService.decorateApplications(appInfos, bucket);
    appstreamImage.applications = decoratedApplications;
    return { workflowId, instanceId, dapEnabled, ...appstreamImage };
  }

  _createPlaceHolderImage(row) {
    return {
      name: row.id,
      displayName: row.id,
      state: PROCESSING,
      visibility: '',
      platform: '',
      createdTime: row.createdAt,
      applications: [],
      sharedAccounts: [],
      workflowId: row.workflowId,
      instanceId: row.instanceId,
      dapEnabled: row.dapEnabled,
    };
  }

  async _getImageSharing(name) {
    const [aws] = await this.service(['aws']);
    const appstream = new aws.sdk.AppStream();
    // TODO - Allow for pagination
    const permissions = await appstream.describeImagePermissions({ Name: name }).promise();
    const accounts = permissions.SharedImagePermissionsList.map(item => item.sharedAccountId);

    return accounts;
  }

  async shareImage(requestContext, { imageName, accountId }) {
    await this.assertAuthorized(requestContext, { action: AppstreamAuthzService.SHARE_IMAGE });
    if (!this._validateAccountId(accountId)) {
      throw this.boom.badRequest('Invalid Account ID');
    }
    const [aws, validationService] = await this.service(['aws', 'jsonSchemaValidationService']);
    const appstream = new aws.sdk.AppStream();
    const params = {
      ImagePermissions: {
        allowFleet: true,
        allowImageBuilder: true,
      },
      Name: imageName,
      SharedAccountId: accountId,
    };
    await validationService.ensureValid(params, imageSharingSchema);
    const result = await appstream.updateImagePermissions(params).promise();
    return result;
  }

  async revokeImageSharing(requestContext, { imageName, accountId }) {
    await this.assertAuthorized(requestContext, { action: AppstreamAuthzService.REVOKE_IMAGE_SHARING });
    const [aws, validationService] = await this.service(['aws', 'jsonSchemaValidationService']);
    const appstream = new aws.sdk.AppStream();
    const params = {
      Name: imageName,
      SharedAccountId: accountId,
    };
    await validationService.ensureValid(params, imageSharingSchema);
    const result = await appstream.deleteImagePermissions(params).promise();
    return result;
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

    return applications;
  }

  async createImage(
    requestContext,
    {
      imageName,
      applications: appKeys,
      dapEnabled,
      imageBuilderID,
      snapshotImage,
      deleteImageBuilder,
      instanceType,
      appstreamImageArn,
    },
  ) {
    await this.assertAuthorized(requestContext, { action: AppstreamAuthzService.CREATE_IMAGE }, {});
    const [validationService] = await this.service(['jsonSchemaValidationService']);
    const defaultAppstreamImageArn = this.settings.get(settingKeys.appstreamImageArn);

    if (_.isEmpty(appKeys)) {
      throw this.boom.notFound(requestContext.i18n(keys.MINIMUM_ONE_APPLICATION), true);
    }

    const id = imageName;
    await validationService.ensureValid(
      {
        id,
        applications: appKeys,
        dapEnabled,
        imageBuilderID,
        instanceType,
        snapshotImage,
        deleteImageBuilder,
      },
      createImageSchema,
    );

    // Prepare s3 metadata
    const appstreamUtilService = await this.service('appstreamUtilService');
    const copiedAppKeys = await appstreamUtilService.prepareS3Metadata(requestContext, appKeys, imageName);

    // Decorate model with createdBy information.
    const by = _.get(requestContext, 'principalIdentifier.uid');
    const imageModel = { id, applications: copiedAppKeys, dapEnabled, instanceType };
    const dbObject = this.fromRawToDbObject(imageModel, { rev: 0, createdBy: by, updatedBy: by });

    // Save a record in DDB
    await runAndCatch(
      async () => {
        return this._updater()
          .condition('attribute_not_exists(id)') // Error if already exists
          .key({ id })
          .item(dbObject)
          .update();
      },
      async () => {
        throw this.boom.badRequest(`Appstream with id "${id}" already exists`, true);
      },
    );

    // Now get ready to kickoff the workflow.
    const wf = await this.createWorkflow(
      requestContext,
      instanceType,
      copiedAppKeys,
      imageName,
      imageBuilderID,
      dapEnabled,
      snapshotImage,
      deleteImageBuilder,
      appstreamImageArn || defaultAppstreamImageArn,
    );

    const { workflowId, trigger } = wf;

    // Update the record with the WorkFlow and Instance Ids.
    const dbUpdate = this.fromRawToDbObject(
      { id, workflowId, instanceId: trigger.instance.id },
      { rev: 0, createdBy: by, updatedBy: by },
    );
    await runAndCatch(
      async () => {
        return this._updater()
          .key({ id })
          .item(dbUpdate)
          .update();
      },
      async () => {
        // TODO - Handle the case that the record does not exist.
      },
    );

    return this._createPlaceHolderImage({
      id,
      workflowId,
      dapEnabled,
      instanceId: trigger.instance.id,
      createdAt: new Date().toISOString(),
    });
  }

  async createWorkflow(
    requestContext,
    instanceType,
    copiedAppKeys,
    imageName,
    imageBuilderID,
    dapEnabled,
    snapshotImage,
    deleteImageBuilder,
    appstreamImageArn,
  ) {
    const destBucket = this.settings.get(settingKeys.installerHostWorkBucketName);
    const [s3Service, stepTemplateService, workflowTriggerService, workflowDraftService] = await this.service([
      's3Service',
      'stepTemplateService',
      'workflowTriggerService',
      'workflowDraftService',
    ]);
    const workflowIdRaw = `wf-${imageName}`;
    const workflowId = this.getWorkflowId(imageName);

    const prepareStepTpl = (
      await stepTemplateService.listVersions(requestContext, { id: 'st-prepare-image-builder-environment' })
    )[0];
    const launchStepTpl = (
      await stepTemplateService.listVersions(requestContext, { id: 'st-launch-image-builder' })
    )[0];
    const dyncatStepTpl = (
      await stepTemplateService.listVersions(requestContext, { id: 'st-install-dynamic-catalog-script' })
    )[0];
    const waitStepTpl = (
      await stepTemplateService.listVersions(requestContext, { id: 'st-wait-for-image-builder' })
    )[0];
    const cleanupStepTpl = (await stepTemplateService.listVersions(requestContext, { id: 'st-cleanup' }))[0];

    await workflowDraftService.createDraft(requestContext, {
      workflowId: workflowIdRaw,
      templateId: 'wt-empty',
    });

    let stepNum = '';

    const createStep = (tpl, configs = {}) => {
      stepNum += 1;
      return {
        id: `wf-step_1_1499799482398_206_${stepNum}`,
        stepTemplateId: tpl.id,
        stepTemplateVer: tpl.v,
        title: tpl.title,
        desc: tpl.desc,
        skippable: true,
        configs,
      };
    };

    const prepareStep = createStep(prepareStepTpl, {});
    const launchStep = createStep(launchStepTpl, { dapEnabled, instanceType, appstreamImageArn });
    const dyncatStep = createStep(dyncatStepTpl, { imageBuilderID });
    const waitStep = createStep(waitStepTpl, { dapEnabled, imageBuilderID });
    const cleanupStep = createStep(cleanupStepTpl, { imageBuilderID });

    const applications = await Promise.all(copiedAppKeys.map(k => applicationFromInfo(s3Service, destBucket, k)));
    const executeSteps = await Promise.all(
      applications.map(async application => {
        const step = await executeStep(requestContext, application, this, s3Service, dapEnabled, imageBuilderID);
        return step;
      }),
    );

    const selectedSteps = [];

    if (!imageBuilderID || imageBuilderID.length === 0) {
      selectedSteps.push(prepareStep);
      selectedSteps.push(launchStep);
    }

    selectedSteps.push(...executeSteps);

    // regardless of user preference on dapEnabled, we
    // need to install the dyncat scripts if the environment is ad-joined.
    // this is because we're going to create an implicit dynamic catalogue.
    const adJoined = this.settings.get(settingKeys.adJoined);
    if (adJoined) {
      selectedSteps.push(dyncatStep);
    }

    if (snapshotImage) {
      selectedSteps.push(waitStep);
    }

    if (deleteImageBuilder) {
      selectedSteps.push(cleanupStep);
    }

    const by = _.get(requestContext, 'principalIdentifier.uid');
    const updateParams = {
      id: `${by}_${workflowId}_0`,
      rev: 0,
      workflow: {
        id: workflowId,
        title: imageName,
        desc: `Installation of ${applications.map(a => a.applicationDisplayName).join(', ')}`,
        v: 1,
        rev: 0,
        workflowTemplateId: 'wt-empty',
        workflowTemplateVer: 1,
        selectedSteps,
        runSpec: { size: 'small', target: 'stepFunctions' },
      },
    };

    await workflowDraftService.updateDraft(requestContext, updateParams);
    updateParams.rev += 1;
    await workflowDraftService.publishDraft(requestContext, updateParams);

    const trigger = await workflowTriggerService.triggerWorkflow(
      requestContext,
      {
        workflowId,
        workflowVer: 1,
        status: 'in_progress',
      },
      {},
    );

    return { workflowId, trigger };
  }

  async deleteImage(requestContext, { imageName }) {
    await this.assertAuthorized(requestContext, { action: AppstreamAuthzService.DELETE_IMAGE });
    const [aws, workflowService, s3Service] = await this.service(['aws', 'workflowService', 's3Service']);
    const appstream = new aws.sdk.AppStream();
    const bucket = this.settings.get(settingKeys.installerHostWorkBucketName);

    // Delete the DDB record
    await runAndCatch(
      async () => {
        await this._deleter()
          .condition('attribute_exists(id)') // yes we need this
          .key({ id: imageName })
          .delete();
      },
      async () => {
        throw this.boom.notFound(requestContext.i18n(keys.IMAGE_NOT_FOUND, { imageName }), true);
      },
    );

    // Delete the actual AppStream Image.
    try {
      await appstream.deleteImage({ Name: imageName }).promise();
    } catch (e) {
      // If the image simply couldn't be found continue with the deletion process.
      // As the API handler role has very limited scope, treat AccessDenied as ResourceNotFound
      // If an error occurs in image creation, the role will not be able to list all images to verify
      if (e.code !== 'ResourceNotFoundException' && e.code !== 'AccessDeniedException') {
        const safe = e.code === 'ResourceInUseException';
        throw this.boom.badRequest(e.message, safe);
      }
    }

    try {
      const workflowId = this.getWorkflowId(imageName);
      await workflowService.deleteAllWorkflowVersions(requestContext, { id: workflowId });
    } catch (e) {
      // Log the error deleting the workflow versions, but continue with deleting the other Image related assets
      this.log.error(e.message);
    }

    try {
      await s3Service.deleteObjectsWithPrefix({ bucket, prefix: `${IMAGE_APPLICATIONS_PATH}/${imageName}` });
    } catch (e) {
      // Log the error deleting the s3 assets, but continue with the process of deletion.
      this.log.error(e.message);
    }

    return {};
  }

  async listFleets(requestContext) {
    const appstreamUtilService = await this.service('appstreamUtilService');
    return appstreamUtilService.listFleets(requestContext);
  }

  async createFleet(
    requestContext,
    {
      fleetName,
      imageName,
      instanceType,
      fleetType,
      streamView,
      maxUserDurationInMinutes,
      disconnectTimeoutInMinutes,
      idleDisconnectTimeoutInMinutes,
      desiredCapacity,
    },
  ) {
    await this.assertAuthorized(requestContext, { action: AppstreamAuthzService.CREATE_FLEET });

    const [aws, dynamicCatalogService, validationService] = await this.service([
      'aws',
      'dynamicCatalogService',
      'jsonSchemaValidationService',
    ]);

    const appstream = new aws.sdk.AppStream();
    const appstreamInstanceRoleArn = this.settings.get(settingKeys.appstreamInstanceRoleArn);
    const subnet = this.settings.get(settingKeys.subnet);
    const adDomainName = this.settings.get(settingKeys.adDomainName);
    const ou = this.settings.get(settingKeys.ou);
    const appstreamUtilService = await this.service('appstreamUtilService');
    const namespace = this.settings.get(settingKeys.namespace);

    const image = await appstreamUtilService._mustFindImage(requestContext, imageName);

    const params = {
      Name: fleetName,
      ImageName: imageName,
      InstanceType: instanceType,
      FleetType: fleetType,
      StreamView: streamView,
      MaxUserDurationInSeconds: maxUserDurationInMinutes * 60,
      DisconnectTimeoutInSeconds: disconnectTimeoutInMinutes * 60,
      IdleDisconnectTimeoutInSeconds: idleDisconnectTimeoutInMinutes * 60,
      EnableDefaultInternetAccess: false,
      IamRoleArn: appstreamInstanceRoleArn,
      VpcConfig: {
        SubnetIds: [subnet],
      },
      ComputeCapacity: {
        DesiredInstances: parseInt(desiredCapacity, 10),
      },
      Tags: {
        Name: `${namespace}-image-builder`,
      },
    };

    if (image.dapEnabled) {
      params.DomainJoinInfo = {
        DirectoryName: adDomainName,
        OrganizationalUnitDistinguishedName: ou,
      };
    }

    await validationService.ensureValid(params, createFleetSchema);

    const result = await appstream.createFleet(params).promise();
    const fleet = appstreamUtilService._toFleet(result.Fleet);

    // For now we are keeping both fleet and stack names identical.
    const stackName = fleetName;
    const stack = await this._createStack(requestContext, { stackName });

    await this._associateFleet(requestContext, { fleetName, stackName });

    // Create an implicit dynamic catalog if the environment is ad-joined
    const applications = image.applications;
    if (image.dapEnabled) {
      await dynamicCatalogService.createDynamicCatalog(requestContext, {
        dynamicCatalogName: `${IMPLICIT_CATALOG_PREFIX}${fleetName}`,
        fleet: fleetName,
        applications,
      });
    }

    return {
      fleet,
      stack,
    };
  }

  async _associateFleet(_requestContext, { fleetName, stackName }) {
    const [aws] = await this.service(['aws']);
    const appstream = new aws.sdk.AppStream();
    const params = {
      FleetName: fleetName,
      StackName: stackName,
    };
    const result = appstream.associateFleet(params).promise();
    return result;
  }

  async _createStack(_requestContext, { stackName }) {
    const gsuiteDomains = this.settings.optional(settingKeys.gsuiteDomains, '');
    const embedHosts = this.settings.optional(settingKeys.embedHosts, '');
    const namespace = this.settings.get(settingKeys.namespace);

    const storageConnectors = [
      {
        ConnectorType: 'HOMEFOLDERS',
      },
    ];

    if (gsuiteDomains && gsuiteDomains.length > 0) {
      storageConnectors.push({
        ConnectorType: 'GOOGLE_DRIVE',
        Domains: gsuiteDomains.split(','),
      });
    }

    let embedHostDomains;
    if (embedHosts && embedHosts.length > 0) {
      embedHostDomains = embedHosts.split(',');
    } else {
      embedHostDomains = [];
    }

    const params = {
      Name: stackName,
      StorageConnectors: storageConnectors,
      ApplicationSettings: {
        Enabled: true,
        SettingsGroup: 'user_settings',
      },
      Tags: {
        Name: `${namespace}-image-builder`,
      },
    };

    if (embedHostDomains.length > 0) {
      params.EmbedHostDomains = embedHostDomains;
    }

    const [aws] = await this.service(['aws']);
    const appstream = new aws.sdk.AppStream();
    const stack = await appstream.createStack(params).promise();
    return stack;
  }

  async _fleetOperation(requestContext, fleetName, action, f) {
    const fleet = { name: fleetName };
    const appstreamUtilService = await this.service('appstreamUtilService');
    await appstreamUtilService.loadFleetGroupAccess(requestContext, fleet);
    await this.assertAuthorized(requestContext, { action }, fleet);
    const [aws] = await this.service(['aws']);
    const appstream = new aws.sdk.AppStream();
    return f(appstream);
  }

  async startFleet(requestContext, { fleetName }) {
    return this._fleetOperation(requestContext, fleetName, AppstreamAuthzService.START_FLEET, async appstream => {
      return appstream.startFleet({ Name: fleetName }).promise();
    });
  }

  async stopFleet(requestContext, { fleetName }) {
    return this._fleetOperation(requestContext, fleetName, AppstreamAuthzService.STOP_FLEET, async appstream => {
      return appstream.stopFleet({ Name: fleetName }).promise();
    });
  }

  async deleteFleet(requestContext, { fleetName }) {
    await this._fleetOperation(requestContext, fleetName, AppstreamAuthzService.DELETE_FLEET, async appstream => {
      await appstream.disassociateFleet({ FleetName: fleetName, StackName: fleetName }).promise();
      await appstream.deleteFleet({ Name: fleetName }).promise();
      await appstream.deleteStack({ Name: fleetName }).promise();

      // Revoke all group access
      const [groupAccessService] = await this.service(['groupAccessService']);
      const groups = await groupAccessService.find(requestContext, {
        targetType: TARGET_TYPE,
        targetId: fleetName,
      });

      // eslint-disable-next-line no-restricted-syntax
      for (const group of groups) {
        // eslint-disable-next-line no-await-in-loop
        await this.revokeFleetAccess(requestContext, { fleetName, groupId: group.groupId });
      }

      // Delete all dynamic catalogs
      const dynamicCatalogService = await this.service('dynamicCatalogService');
      const catalogs = await this.dynamicCatalogs(requestContext, fleetName);
      // eslint-disable-next-line no-restricted-syntax
      for (const dc of catalogs) {
        // eslint-disable-next-line no-await-in-loop
        await dynamicCatalogService.deleteDynamicCatalog(requestContext, { id: dc.id });
      }
    });

    return { fleetName };
  }

  async getFleetTestLink(requestContext, { fleetName }) {
    return this._fleetOperation(requestContext, fleetName, AppstreamAuthzService.GET_FLEET_LINK, async _a => {
      const userId = _.get(requestContext, 'principalIdentifier.uid');
      const result = await this.getFleetLink(requestContext, { fleetName, userId });
      return result;
    });
  }

  // authorisation is handled upstream
  async getFleetLink(requestContext, { fleetName, userId }) {
    const params = {
      FleetName: fleetName,
      StackName: fleetName,
      UserId: userId.substring(0, 32),
    };
    const [aws] = await this.service(['aws']);
    const appstream = new aws.sdk.AppStream();
    const res = await appstream.createStreamingURL(params).promise();
    return { link: res.StreamingURL, expires: res.Expires };
  }

  async _fleetAccessOperation(requestContext, fleetName, groupFunction, magicFunction) {
    const [groupAccessService, dynamicCatalogService] = await this.service([
      'groupAccessService',
      'dynamicCatalogService',
    ]);

    await groupFunction(groupAccessService);

    // ensure implicit magic catalog access is in sync with fleet access
    const catalogs = await this.dynamicCatalogs(requestContext, fleetName);
    const magic = _.find(catalogs, dc => dc.id.startsWith(IMPLICIT_CATALOG_PREFIX));

    if (magic) {
      await magicFunction(dynamicCatalogService, magic);
    }
  }

  async grantFleetAccess(requestContext, { fleetName, groupId, groupName }) {
    await this._fleetAccessOperation(
      requestContext,
      fleetName,
      async groupAccessService => {
        await groupAccessService.createGroupAccess(requestContext, {
          targetType: TARGET_TYPE,
          targetId: fleetName,
          groupId,
          groupName,
        });
      },
      async (dynamicCatalogService, magic) => {
        await dynamicCatalogService.grantAccess(requestContext, { id: magic.id, groupId, groupName });
      },
    );
  }

  async revokeFleetAccess(requestContext, { fleetName, groupId }) {
    await this._fleetAccessOperation(
      requestContext,
      fleetName,
      async groupAccessService => {
        await groupAccessService.deleteGroupAccess(requestContext, {
          targetType: TARGET_TYPE,
          targetId: fleetName,
          groupId,
        });
      },
      async (dynamicCatalogService, magic) => {
        await dynamicCatalogService.revokeAccess(requestContext, { id: magic.id, groupId });
      },
    );
  }

  async swapFleetImage(requestContext, { fleetName, imageName }) {
    await this.assertAuthorized(requestContext, { action: AppstreamAuthzService.SWAP_IMAGE });
    const [aws] = await this.service(['aws']);
    const appstream = new aws.sdk.AppStream();
    const adDomainName = this.settings.get(settingKeys.adDomainName);
    const ou = this.settings.get(settingKeys.ou);
    const appstreamUtilService = await this.service('appstreamUtilService');

    const image = await appstreamUtilService._mustFindImage(requestContext, imageName);
    const currentImage = await appstreamUtilService.getFleetImage(requestContext, { fleetName });

    if (currentImage.dapEnabled !== image.dapEnabled) {
      const message = currentImage.dapEnabled
        ? requestContext.i18n(keys.DC_NOT_MATCHING_ENABLED)
        : requestContext.i18n(keys.DC_NOT_MATCHING_DISABLE);
      throw this.boom.notFound(message, true);
    }

    const params = {
      Name: fleetName,
      ImageName: imageName,
    };
    if (image.dapEnabled) {
      params.DomainJoinInfo = {
        DirectoryName: adDomainName,
        OrganizationalUnitDistinguishedName: ou,
      };
    }

    const result = await appstream.updateFleet(params).promise();
    const fleet = appstreamUtilService._toFleet(result.Fleet);
    return {
      fleet,
    };
  }

  async dynamicCatalogs(requestContext, fleetName) {
    const dynamicCatalogService = await this.service('dynamicCatalogService');
    const catalogs = await dynamicCatalogService.list(requestContext);
    return _.filter(catalogs, dc => dc.fleet === fleetName);
  }

  async getUsageReportsBucket(_requestContext) {
    const [aws] = await this.service(['aws']);
    const appStream = new aws.sdk.AppStream();
    const result = await appStream.createUsageReportSubscription().promise();
    return result.S3BucketName;
  }

  getWorkflowId(imageName) {
    return slugify(_.kebabCase(_.startsWith(imageName, 'wf-') ? imageName : `wf-${imageName}`));
  }

  fromRawToDbObject(rawObject, overridingProps = {}) {
    const dbObject = { ...rawObject, ...overridingProps };
    return dbObject;
  }

  _validateAccountId(accountId) {
    const regex = /^\d{12}$/;
    if (regex.test(accountId)) {
      return true;
    }
    return false;
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

export default AppstreamService;
