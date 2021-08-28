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

import { servicesPlugin as baseServicesPlugin, stepsPlugin as baseStepsPlugin } from '@aws-ee/base-post-deployment';

import {
  authenticationProvisionerPlugin as cognitoAuthNProvisionerPlugin,
  servicesPlugin as cognitoAuthServicesPlugin,
  userManagementPlugin as cognitoUserManagementPlugin,
} from '@aws-ee/base-auth-cognito-post-deployment';

import {
  servicesPlugin as baseApisServicesPlugin,
  stepsPlugin as baseApisStepsPlugin,
  usersPlugin as baseUsersPlugin,
} from '@aws-ee/base-api-post-deployment-steps';

import {
  servicesPlugin as baseUiPublicHostingServicesPlugin,
  stepsPlugin as baseUiPublicHostingStepsPlugin,
} from '@aws-ee/base-ui-public-hosting-post-deployment-steps';

import { servicesPlugin as eventBridgeServicesPlugin } from '@aws-ee/eventbridge-services';
import { workflowServicesPlugin, workflowPostDeploymentStepsPlugin } from '@aws-ee/base-workflow-core';
import { baseWfStepsPlugin } from '@aws-ee/base-workflow-steps';
import { baseWfTemplatesPlugin } from '@aws-ee/base-workflow-templates';

import { usersPlugin } from '@aws-ee/main-services';
import { vamUsersPlugin } from '@aws-ee/vam-api-post-deployment-steps';
import { vamStepsPlugin } from '@aws-ee/vam-post-deployment';

import { appstreamImageBuilderWfStepsPlugin } from '@aws-ee/appstream-image-builder-workflow-steps';
import appstreamImageBuilderStepsPlugin from '@aws-ee/appstream-image-builder-post-deployment-steps';
import servicesPlugin from './plugins/services-plugin';
import stepsPlugin from './plugins/steps-plugin';

const extensionPoints = {
  'service': [
    baseServicesPlugin,
    baseApisServicesPlugin,
    baseUiPublicHostingServicesPlugin,
    servicesPlugin,
    workflowServicesPlugin,
    eventBridgeServicesPlugin,
    cognitoAuthServicesPlugin,
  ],
  'authentication-provisioner': [cognitoAuthNProvisionerPlugin],
  'user-management': [cognitoUserManagementPlugin],
  'postDeploymentStep': [
    baseStepsPlugin,
    baseApisStepsPlugin,
    baseUiPublicHostingStepsPlugin,
    workflowPostDeploymentStepsPlugin,
    stepsPlugin,
    appstreamImageBuilderStepsPlugin,
    vamStepsPlugin,
  ],
  'users': [baseUsersPlugin, usersPlugin, vamUsersPlugin],
  'workflow-steps': [baseWfStepsPlugin, appstreamImageBuilderWfStepsPlugin],
  'workflow-templates': [baseWfTemplatesPlugin],
};

async function getPlugins(extensionPoint) {
  return extensionPoints[extensionPoint];
}

const registry = {
  getPlugins,
};

export default registry;
