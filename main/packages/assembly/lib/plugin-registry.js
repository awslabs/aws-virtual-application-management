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

import baseAssemblyPlugin from '@aws-ee/base-assembly';
import baseAuthCognitoAssemblyPlugin from '@aws-ee/base-auth-cognito-assembly';
import basePostDeploymentAssemblyPlugin from '@aws-ee/base-post-deployment-assembly';
import baseRestApiAssemblyPlugin from '@aws-ee/base-rest-api-assembly';
import baseUiAssemblyPlugin from '@aws-ee/base-ui-assembly';
import baseUiPublicHostingAssemblyPlugin from '@aws-ee/base-ui-public-hosting-assembly';
import baseWorkflowAssemblyPlugin from '@aws-ee/base-workflow-assembly';
import cicdAssemblyPlugin from '@aws-ee/base-cicd-assembly';

import eventBridgeAssemblyPlugin from '@aws-ee/eventbridge-assembly';

import {
  // eslint-disable-next-line import/no-named-default
  default as appstreamImageBuilderAssemblyPlugin,
  appstreamImageBuilderPostDeploymentAssemblyPlugin,
} from '@aws-ee/appstream-image-builder-assembly';
import vamSampleApplicationsAssemblyPlugin from '@aws-ee/vam-sample-applications-assembly';
// eslint-disable-next-line import/no-named-default
import { default as vamApiAssemblyPlugin, vamPostDeploymentAssemblyPlugin } from '@aws-ee/vam-api-assembly';
import vamUiAssemblyPlugin from '@aws-ee/vam-ui-assembly';
import { writeI18nFilesPlugin } from '@aws-ee/base-assembly-tasks';
import {
  vamSSDAssemblyPlugin,
  vamCICDAssemblyPlugin,
  vamCICDDeployAssemblyPlugin,
} from '@aws-ee/vam-silky-smooth-deployments-assembly';

import mainAssemblyPlugin from './assembly-plugin';

// eslint-disable-next-line no-unused-vars
const getPluginRegistry = ({ projectRootDir, componentsDir, targetSolutionDir }) => {
  const extensionPoints = {
    assemble: [
      baseAssemblyPlugin,
      basePostDeploymentAssemblyPlugin,
      baseRestApiAssemblyPlugin,
      baseAuthCognitoAssemblyPlugin, // must be after post-deployment and rest-api
      baseWorkflowAssemblyPlugin,
      baseUiAssemblyPlugin,
      baseUiPublicHostingAssemblyPlugin,
      cicdAssemblyPlugin,
      eventBridgeAssemblyPlugin,
      mainAssemblyPlugin,
      appstreamImageBuilderAssemblyPlugin,
      appstreamImageBuilderPostDeploymentAssemblyPlugin,
      vamApiAssemblyPlugin,
      vamUiAssemblyPlugin,
      vamSampleApplicationsAssemblyPlugin,
      writeI18nFilesPlugin({ namespace: 'backend', outputPath: 'backend/src/i18n' }),
      writeI18nFilesPlugin({ namespace: 'ui', outputPath: 'ui/src/i18n' }),
      writeI18nFilesPlugin({ namespace: 'backend', outputPath: 'vam-api/src/i18n' }),
      vamSSDAssemblyPlugin,
      vamCICDAssemblyPlugin,
      vamCICDDeployAssemblyPlugin,
      vamPostDeploymentAssemblyPlugin,
    ],
  };

  function getPlugins(extensionPoint) {
    return extensionPoints[extensionPoint];
  }

  const registry = {
    getPlugins,
  };

  return registry;
};

export { getPluginRegistry };
