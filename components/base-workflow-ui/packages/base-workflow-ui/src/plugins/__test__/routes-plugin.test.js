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

import plugin from '../routes-plugin';

jest.mock('@aws-ee/base-ui/dist/withAuth');
jest.mock('../../parts/workflow-templates/WorkflowTemplatesList');
jest.mock('../../parts/workflow-templates/drafts/edit/WorkflowTemplateDraftEditor');
jest.mock('../../parts/workflows/WorkflowsList');
jest.mock('../../parts/workflows/drafts/edit/WorkflowDraftEditor');
jest.mock('../../parts/workflows/published/WorkflowDetailPage');
jest.mock('../../parts/workflows/published/WorkflowInstanceDetailPage');

describe('plugin', () => {
  const routesMap = [];
  describe('registerRoutes', () => {
    it('should register app context items', async () => {
      // Mock data
      const location = {};
      const appContext = {};

      // Execution
      const result = await plugin.registerRoutes(routesMap, { location, appContext });

      expect(result.has('/workflow-templates/drafts/edit/:draftId')).toEqual(true);
      expect(result.has('/workflow-templates')).toEqual(true);
      expect(result.has('/workflows/drafts/edit/:draftId')).toEqual(true);
      expect(result.has('/workflows/published/id/:workflowId/v/:version/instances/id/:instanceId')).toEqual(true);
      expect(result.has('/workflows/published/id/:workflowId/v/:version')).toEqual(true);
      expect(result.has('/workflows')).toEqual(true);
    });
  });
});
