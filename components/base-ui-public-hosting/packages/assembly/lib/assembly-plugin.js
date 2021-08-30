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

import { wrapAssemblyPlugins } from '@aws-ee/base-assembly-tasks';

import edgeLambdaAssemblyPlugin from './edge-lambda';
import webInfraAssemblyPlugin from './web-infra-overrides';
import postDeploymentAssemblyPlugins from './post-deployment-overrides';
import docsAssemblyPlugin from './docs-overrides';
import backendAssemblyPlugin from './backend-overrides';

const plugin = wrapAssemblyPlugins([
  edgeLambdaAssemblyPlugin,
  webInfraAssemblyPlugin,
  ...postDeploymentAssemblyPlugins,
  docsAssemblyPlugin,
  backendAssemblyPlugin,
]);

export default plugin;
