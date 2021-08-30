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

import { docsPlugin as baseDocsPlugin } from '@aws-ee/base-docs';
import { docsPlugin as baseUiDocsPlugin } from '@aws-ee/base-ui-docs';
import { docsPlugin as baseUiPublicHostingDocsPlugin } from '@aws-ee/base-ui-public-hosting-docs';
import { docsPlugin as baseAuthCognitoDocsPlugin } from '@aws-ee/base-auth-cognito-docs';
import { docsPlugin as baseControllersDocsPlugin } from '@aws-ee/base-controllers';
// import { docsPlugin as baseWorkflowApiDocsPlugin } from '@aws-ee/base-workflow-api';
import { docsPlugin as baseWorkflowUiDocsPlugin } from '@aws-ee/base-workflow-ui-docs';
import { docsPlugin as vamApiDocsPlugin } from '@aws-ee/vam-api';
import { docsPlugin as vamUIDocsPlugin } from '@aws-ee/vam-ui';
import docsPlugin from './plugins/docs-plugin';

const extensionPoints = {
  docs: [
    baseDocsPlugin,
    baseUiDocsPlugin,
    baseUiPublicHostingDocsPlugin,
    baseAuthCognitoDocsPlugin,
    baseControllersDocsPlugin,
    // baseWorkflowApiDocsPlugin,
    baseWorkflowUiDocsPlugin,
    vamApiDocsPlugin,
    vamUIDocsPlugin,
    docsPlugin,
  ],
};

async function getPlugins(extensionPoint) {
  return extensionPoints[extensionPoint] || [];
}

export default {
  getPlugins,
};
