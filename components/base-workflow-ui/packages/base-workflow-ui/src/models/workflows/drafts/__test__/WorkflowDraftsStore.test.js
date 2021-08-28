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

// import _ from 'lodash/fp';
// import { itProp, fc } from 'jest-fast-check';
import { registerContextItems } from '../WorkflowDraftsStore';

import {
  getWorkflowDrafts,
  createWorkflowDraft,
  updateWorkflowDraft,
  publishWorkflowDraft,
} from '../../../../helpers/api';

jest.mock('../../../../helpers/api');

describe('WorkflowDraftsStore', () => {
  let store = null;
  const appContext = {};
  const addWorkflowDraft = {
    id: 'test-workflowDraft-id-1',
    rev: 1,
    uid: 'test-workflowDraft-uid',
    workflowId: 'test-workflow-id',
    workflowVer: 1,
    templateId: 'test-template-id',
    templateVer: 1,
    username: 'test-username',
    createdAt: '',
    createdBy: '',
    updatedAt: '',
    updatedBy: '',
    workflow: {
      id: 'test-workflow-id',
      v: 1,
      rev: 1,
      createdAt: '',
      createdBy: '',
      updatedAt: '',
      updatedBy: '',
      title: '',
      desc: '',
      instanceTtl: 1,
      runSpec: { size: '0', target: '' },
      stepsOrderChanged: true,
      selectedSteps: [
        {
          id: 'test-step-id',
          stepTemplateId: '',
          stepTemplateVer: 1,
          title: 'test-step-title',
          desc: 'test-desc',
          propsOverrideOption: {},
          configOverrideOption: {},
          skippable: true,
        },
      ],
      instancesMap: {},
      workflowTemplateId: '',
      workflowTemplateVer: 1,
    },
  };

  const updateNewWorkflowDraft = {
    id: 'test-workflowDraft-id',
    rev: 1,
    uid: 'test-workflowDraft-uid',
    workflowId: 'test-workflow-id',
    workflowVer: 1,
    templateId: 'test-template-id',
    templateVer: 1,
    username: 'test-username',
    createdAt: '',
    createdBy: '',
    updatedAt: '',
    updatedBy: '',
    workflow: {
      id: 'test-workflow-id',
      v: 1,
      rev: 1,
      createdAt: '',
      createdBy: '',
      updatedAt: '',
      updatedBy: '',
      title: '',
      desc: '',
      instanceTtl: 1,
      runSpec: { size: '0', target: '' },
      stepsOrderChanged: true,
      selectedSteps: [
        {
          id: 'test-step-id',
          stepTemplateId: '',
          stepTemplateVer: 1,
          title: 'test-step-title',
          desc: 'test-desc',
          propsOverrideOption: {},
          configOverrideOption: {},
          skippable: true,
        },
      ],
      instancesMap: {},
      workflowTemplateId: '',
      workflowTemplateVer: 1,
    },
  };

  const newWorkflowDraft = [
    {
      id: 'test-workflowDraft-id',
      rev: 1,
      uid: 'test-workflowDraft-uid',
      workflowId: 'test-workflow-id',
      workflowVer: 1,
      templateId: 'test-template-id',
      templateVer: 1,
      username: 'test-username',
      createdAt: '',
      createdBy: '',
      updatedAt: '',
      updatedBy: '',
      workflow: {
        id: 'test-workflow-id',
        v: 1,
        rev: 1,
        createdAt: '',
        createdBy: '',
        updatedAt: '',
        updatedBy: '',
        title: '',
        desc: '',
        instanceTtl: 1,
        runSpec: { size: '0', target: '' },
        stepsOrderChanged: true,
        selectedSteps: [
          {
            id: 'test-step-id',
            stepTemplateId: '',
            stepTemplateVer: 1,
            title: 'test-step-title',
            desc: 'test-desc',
            propsOverrideOption: {},
            configOverrideOption: {},
            skippable: true,
          },
        ],
        instancesMap: {},
        workflowTemplateId: '',
        workflowTemplateVer: 1,
      },
    },
  ];

  beforeEach(async () => {
    await registerContextItems(appContext);
    store = appContext.workflowDraftsStore;
    getWorkflowDrafts.mockResolvedValueOnce(newWorkflowDraft);
    createWorkflowDraft.mockResolvedValueOnce(addWorkflowDraft);
    updateWorkflowDraft.mockResolvedValueOnce(updateNewWorkflowDraft);
    publishWorkflowDraft.mockResolvedValueOnce(updateNewWorkflowDraft);
    await store.load();
  });

  describe('store', () => {
    it('should contain a version as initialized', async () => {
      const list = store.list;
      // CHECK
      expect(store.empty).toBe(false);
      expect(store.total).toEqual(1);
      expect(list[0].id).toEqual('test-workflowDraft-id');
    });

    it('should add draft via addDraft', async () => {
      await store.cleanup();
      await store.addDraft(addWorkflowDraft);
      const list = store.list;
      expect(store.total).toEqual(1);
      expect(list[0].id).toEqual('test-workflowDraft-id-1');
    });

    it('should create draft via createDraft', async () => {
      const result = await store.createDraft({
        isNewWorkflow: true,
        workflowId: 'test-workflow-id',
        templateId: 'test-template-id',
      });
      expect(result).toEqual(addWorkflowDraft);
    });
    it('should remove draft via cleanup', async () => {
      await store.cleanup();
      expect(store.empty).toBe(true);
    });
  });
});
