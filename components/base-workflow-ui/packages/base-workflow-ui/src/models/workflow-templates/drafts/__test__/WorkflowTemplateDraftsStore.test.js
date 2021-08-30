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

import { registerContextItems } from '../WorkflowTemplateDraftsStore';
import {
  getWorkflowTemplateDrafts,
  createWorkflowTemplateDraft,
  publishWorkflowTemplateDraft,
} from '../../../../helpers/api';

jest.mock('../../../../helpers/api');

describe('WorkflowTemplateDraftsStore', () => {
  let store = null;
  const appContext = {};
  const mockDraft = {
    id: 'test-id',
    rev: 0,
    uid: '',
    username: 'test-username',
    createdAt: '',
    createdBy: '',
    updatedAt: '',
    updatedBy: '',
    templateId: '',
    template: {
      id: '',
      v: 0,
      rev: 0,
      createdAt: '',
      createdBy: '',
      updatedAt: '',
      updatedBy: '',
      title: '',
      desc: '',
      instanceTtl: 1,
      runSpec: { size: '', target: '' },
      propsOverrideOption: { allowed: [] },
      selectedSteps: [],
    },
  };

  const rawDraft = {
    id: 'test-rawDraft-id',
    rev: 0,
    uid: '',
    username: 'test-username',
    createdAt: '',
    createdBy: '',
    updatedAt: '',
    updatedBy: '',
    templateId: 'test-template-id',
    template: {
      id: 'test-template-id',
      v: 0,
      rev: 0,
      createdAt: '',
      createdBy: '',
      updatedAt: '',
      updatedBy: '',
      title: 'test-template-title',
      desc: '',
      instanceTtl: 1,
      runSpec: { size: '', target: '' },
      propsOverrideOption: { allowed: [] },
      selectedSteps: [],
    },
  };
  getWorkflowTemplateDrafts.mockResolvedValue([mockDraft]);
  createWorkflowTemplateDraft.mockResolvedValue(rawDraft);
  publishWorkflowTemplateDraft.mockResolvedValue(true);
  beforeEach(async () => {
    await registerContextItems(appContext);
    store = appContext.workflowTemplateDraftsStore;
    await store.load();
  });

  describe('store-action', () => {
    it('should load drafts', async () => {
      expect(store.empty).toBe(false);
      expect(store.total).toBe(1);
    });

    it('should add drafts', async () => {
      store.addDraft(rawDraft);
      expect(store.empty).toBe(false);
      expect(store.total).toBe(2);
    });

    it('should create drafts', async () => {
      store.cleanup();
      await store.createDraft({
        isNewTemplate: false,
        templateId: 'test-template-id',
        templateTitle: 'test-template-title',
      });
      expect(store.empty).toBe(false);
      expect(store.total).toBe(1);
    });

    it('should remove drafts via cleanup', async () => {
      store.cleanup();
      expect(store.empty).toBe(true);
    });
  });
});
