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

import path from 'path';

import {
  slsCommandsPlugin as baseAuthCognitoCommandsPlugin,
  slsInfoPlugin as baseAuthCognitoInfoPlugin,
} from '@aws-ee/base-auth-cognito-serverless-commands';
import slsCommandsPlugin from './sls-commands-plugin';
import slsPackagePlugin from './sls-package-plugin';
import slsDeployPlugin from './sls-deploy-plugin';
import slsInfoPlugin from './sls-info-plugin';
import slsRemovePlugin from './sls-remove-plugin';

// eslint-disable-next-line no-unused-vars
const getPluginRegistry = ({ projectRootDir, componentsDir, targetSolutionDir }) => {
  const requireIfExists = modulePath => {
    // The targetSolutionDir points to the full path of the ".generated-solution" dir
    const fullModulePath = path.join(targetSolutionDir, modulePath);
    try {
      // eslint-disable-next-line import/no-dynamic-require,global-require
      return require(fullModulePath);
    } catch (err) {
      // console.error(err);
      // eslint-disable-next-line no-console
      console.log(
        `WARNING: Unable to load ${fullModulePath}. This can happen if you did not run "pnpx sls solution-assemble" before.`,
      );
    }
    return {};
  };

  const customDomainsPackagePlugin = requireIfExists('custom-domains/scripts/plugins/sls-package-plugin.js');
  const customDomainsDeployPlugin = requireIfExists('custom-domains/scripts/plugins/sls-deploy-plugin.js');
  const customDomainsRemovePlugin = requireIfExists('custom-domains/scripts/plugins/sls-remove-plugin.js');

  const eventBridgeInfraPackagePlugin = requireIfExists('eventbridge-infra/scripts/plugins/sls-package-plugin.js');
  const eventBridgeInfraDeployPlugin = requireIfExists('eventbridge-infra/scripts/plugins/sls-deploy-plugin.js');
  const eventBridgeInfraRemovePlugin = requireIfExists('eventbridge-infra/scripts/plugins/sls-remove-plugin.js');

  const webInfraPackagePlugin = requireIfExists('web-infra/scripts/plugins/sls-package-plugin.js');
  const webInfraDeployPlugin = requireIfExists('web-infra/scripts/plugins/sls-deploy-plugin.js');
  const webInfraInfoPlugin = requireIfExists('web-infra/scripts/plugins/sls-info-plugin.js');
  const webInfraRemovePlugin = requireIfExists('web-infra/scripts/plugins/sls-remove-plugin.js');

  const backendPackagePlugin = requireIfExists('backend/scripts/plugins/sls-package-plugin.js');
  const backendDeployPlugin = requireIfExists('backend/scripts/plugins/sls-deploy-plugin.js');
  const backendInfoPlugin = requireIfExists('backend/scripts/plugins/sls-info-plugin.js');
  const backendRemovePlugin = requireIfExists('backend/scripts/plugins/sls-remove-plugin.js');

  const edgeLambdaPackagePlugin = requireIfExists('edge-lambda/scripts/plugins/sls-package-plugin.js');
  const edgeLambdaDeployPlugin = requireIfExists('edge-lambda/scripts/plugins/sls-deploy-plugin.js');
  const edgeLambdaRemovePlugin = requireIfExists('edge-lambda/scripts/plugins/sls-remove-plugin.js');

  const postDeploymentPackagePlugin = requireIfExists('post-deployment/scripts/plugins/sls-package-plugin.js');
  const postDeploymentDeployPlugin = requireIfExists('post-deployment/scripts/plugins/sls-deploy-plugin.js');
  const postDeploymentRemovePlugin = requireIfExists('post-deployment/scripts/plugins/sls-remove-plugin.js');

  const uiPackagePlugin = requireIfExists('ui/scripts/plugins/sls-package-plugin.js');
  const uiDeployPlugin = requireIfExists('ui/scripts/plugins/sls-deploy-plugin.js');

  const docsPackagePlugin = requireIfExists('docs/scripts/plugins/sls-package-plugin.js');
  const docsDeployPlugin = requireIfExists('docs/scripts/plugins/sls-deploy-plugin.js');

  const cicdPipelinePlugin = requireIfExists('cicd/cicd-pipeline/scripts/plugins/sls-commands-plugin.js');
  const cicdPipelineInfoPlugin = requireIfExists('cicd/cicd-pipeline/scripts/plugins/sls-info-plugin.js');
  const cicdTargetPlugin = requireIfExists('cicd/cicd-target/scripts/plugins/sls-commands-plugin.js');
  const cicdTargetInfoPlugin = requireIfExists('cicd/cicd-target/scripts/plugins/sls-info-plugin.js');
  const cicdUtilsPlugin = requireIfExists('cicd/cicd-utils/scripts/plugins/sls-commands-plugin.js');

  const appstreamImageBuilderPackagePlugin = requireIfExists(
    'appstream-image-builder/scripts/plugins/sls-package-plugin.js',
  );
  const appstreamImageBuilderDeployPlugin = requireIfExists(
    'appstream-image-builder/scripts/plugins/sls-deploy-plugin.js',
  );
  const appstreamImageBuilderRemovePlugin = requireIfExists(
    'appstream-image-builder/scripts/plugins/sls-remove-plugin.js',
  );

  const vamSampleApplicationsDeployPlugin = requireIfExists(
    'vam-sample-applications/scripts/plugins/sls-deploy-plugin.js',
  );

  const vamSSDPlugin = requireIfExists('vam-silky-smooth-deployments/scripts/plugins/sls-commands-plugin.js');
  const vamSSDInfoPlugin = requireIfExists('vam-silky-smooth-deployments/scripts/plugins/sls-info-plugin.js');

  const vamApiPackagePlugin = requireIfExists('vam-api/scripts/plugins/sls-package-plugin.js');
  const vamApiDeployPlugin = requireIfExists('vam-api/scripts/plugins/sls-deploy-plugin.js');
  const vamApiInfoPlugin = requireIfExists('vam-api/scripts/plugins/sls-info-plugin.js');
  const vamApiRemovePlugin = requireIfExists('vam-api/scripts/plugins/sls-remove-plugin.js');

  const extensionPoints = {
    commands: [
      baseAuthCognitoCommandsPlugin,
      cicdPipelinePlugin,
      cicdTargetPlugin,
      cicdUtilsPlugin,
      slsCommandsPlugin,
      vamSSDPlugin,
    ],
    package: [
      appstreamImageBuilderPackagePlugin,
      backendPackagePlugin,
      customDomainsPackagePlugin,
      docsPackagePlugin,
      edgeLambdaPackagePlugin,
      eventBridgeInfraPackagePlugin,
      postDeploymentPackagePlugin,
      slsPackagePlugin,
      uiPackagePlugin,
      webInfraPackagePlugin,
      vamApiPackagePlugin,
    ],
    deploy: [
      customDomainsDeployPlugin,
      webInfraDeployPlugin,
      docsDeployPlugin,
      appstreamImageBuilderDeployPlugin,
      backendDeployPlugin,
      edgeLambdaDeployPlugin,
      vamSampleApplicationsDeployPlugin,
      eventBridgeInfraDeployPlugin,
      postDeploymentDeployPlugin,
      slsDeployPlugin,
      uiDeployPlugin,
      vamApiDeployPlugin,
    ],
    info: [
      baseAuthCognitoInfoPlugin,
      webInfraInfoPlugin,
      backendInfoPlugin,
      cicdPipelineInfoPlugin,
      cicdTargetInfoPlugin,
      slsInfoPlugin,
      vamSSDInfoPlugin,
      vamApiInfoPlugin,
    ],
    remove: [
      vamApiRemovePlugin,
      postDeploymentRemovePlugin,
      edgeLambdaRemovePlugin,
      backendRemovePlugin,
      appstreamImageBuilderRemovePlugin,
      eventBridgeInfraRemovePlugin,
      slsRemovePlugin,
      webInfraRemovePlugin,
      customDomainsRemovePlugin,
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
