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

import { itProp, fc } from 'jest-fast-check';
import {
  getWorkflowTemplates,
  getWorkflowTemplate,
  getWorkflowTemplateDrafts,
  createWorkflowTemplateDraft,
  updateWorkflowTemplateDraft,
  publishWorkflowTemplateDraft,
  deleteWorkflowTemplateDraft,
  getStepTemplates,
  getWorkflows,
  getWorkflowDrafts,
  createWorkflowDraft,
  updateWorkflowDraft,
  publishWorkflowDraft,
  deleteWorkflowDraft,
  getWorkflow,
  listWorkflowInstancesByStatus,
  getWorkflowInstances,
  getWorkflowInstance,
  triggerWorkflow,
  getWorkflowEventTriggers,
  deleteWorkflowEventTrigger,
  createWorkflowEventTrigger,
} from '../api';

const options = {
  cache: 'no-cache',
  headers: { 'Accept': 'application/json', 'Authorization': 'undefined', 'Content-Type': 'application/json' },
  mode: 'cors',
  redirect: 'follow',
  params: undefined,
};

const spyFetch = () => {
  global.fetch = () => {
    return {
      a: 'b',
    };
  };
  return jest.spyOn(global, 'fetch');
};

describe('api', () => {
  describe('getWorkflowTemplates,', () => {
    itProp('calls fetch all workflow templates', [fc.string(), fc.string()], async () => {
      const spy = spyFetch();
      await getWorkflowTemplates();
      expect(spy).toHaveBeenCalledWith(`undefined/api/workflow-templates`, {
        ...options,
        method: 'GET',
      });
    });
  });

  describe('getWorkflowTemplate,', () => {
    itProp(
      'calls to fetch workflow templates with workflowId',
      [fc.string({ minLength: 1 }), fc.string()],
      async id => {
        const spy = spyFetch();
        await getWorkflowTemplate(id);
        expect(spy).toHaveBeenCalledWith(`undefined/api/workflow-templates/${encodeURIComponent(id)}`, {
          ...options,
          method: 'GET',
        });
      },
    );
  });

  describe('getWorkflowTemplateDrafts,', () => {
    itProp('calls to fetch all workflow drafts', [fc.string(), fc.string()], async () => {
      const spy = spyFetch();
      await getWorkflowTemplateDrafts();
      expect(spy).toHaveBeenCalledWith(`undefined/api/workflow-templates/drafts`, {
        ...options,
        method: 'GET',
      });
    });
  });

  describe('createWorkflowTemplateDraft,', () => {
    itProp(
      'calls to create workflow draft',
      [fc.boolean(), fc.string({ minLength: 1 }), fc.string()],
      async (isNewTemplate, templateId, templateTitle) => {
        const spy = spyFetch();
        await createWorkflowTemplateDraft({
          isNewTemplate,
          templateId,
          templateTitle,
        });
        expect(spy).toHaveBeenCalledWith(`undefined/api/workflow-templates/drafts`, {
          body: JSON.stringify({
            isNewTemplate,
            templateId,
            templateTitle,
          }),
          ...options,
          method: 'POST',
        });
      },
    );
  });

  describe('updateWorkflowTemplateDraft', () => {
    itProp(
      'calls update workflow template draft with given id',
      [fc.record({ id: fc.string() }), fc.string()],
      async draft => {
        const spy = spyFetch();
        await updateWorkflowTemplateDraft(draft);
        expect(spy).toHaveBeenCalledWith(`undefined/api/workflow-templates/drafts/${encodeURIComponent(draft.id)}`, {
          ...options,
          body: JSON.stringify({ id: draft.id }),
          method: 'PUT',
        });
      },
    );
  });

  describe('publishWorkflowTemplateDraft,', () => {
    itProp('calls to create workflow draft', [fc.object(), fc.string()], async draft => {
      const spy = spyFetch();
      await publishWorkflowTemplateDraft(draft);
      expect(spy).toHaveBeenCalledWith(
        `undefined/api/workflow-templates/drafts/publish`,
        expect.objectContaining({
          ...options,
          method: 'POST',
        }),
      );
    });
  });

  describe('deleteWorkflowTemplateDraft,', () => {
    itProp(
      'calls to delete workflow draft with given id',
      [fc.record({ id: fc.string() }), fc.string()],
      async draft => {
        const spy = spyFetch();
        await deleteWorkflowTemplateDraft(draft);
        expect(spy).toHaveBeenCalledWith(
          `undefined/api/workflow-templates/drafts/${encodeURIComponent(draft.id)}`,
          expect.objectContaining({
            ...options,
            method: 'DELETE',
          }),
        );
      },
    );
  });

  describe('getStepTemplates,', () => {
    itProp('calls to fetch stepTemplates', [fc.string(), fc.string()], async () => {
      const spy = spyFetch();
      await getStepTemplates();
      expect(spy).toHaveBeenCalledWith(
        `undefined/api/step-templates`,
        expect.objectContaining({
          ...options,
          method: 'GET',
        }),
      );
    });
  });

  describe('getWorkflows,', () => {
    itProp('calls to fetch workflows', [fc.string(), fc.string()], async () => {
      const spy = spyFetch();
      await getWorkflows();
      expect(spy).toHaveBeenCalledWith(
        `undefined/api/workflows`,
        expect.objectContaining({
          ...options,
          method: 'GET',
        }),
      );
    });
  });

  describe('getWorkflowDrafts,', () => {
    itProp('calls to fetch workflow drafts', [fc.string(), fc.string()], async () => {
      const spy = spyFetch();
      await getWorkflowDrafts();
      expect(spy).toHaveBeenCalledWith(
        `undefined/api/workflows/drafts`,
        expect.objectContaining({
          ...options,
          method: 'GET',
        }),
      );
    });
  });

  describe('createWorkflowDraft,', () => {
    itProp(
      'calls to create workflow drafts',
      [fc.boolean(), fc.string(), fc.string()],
      async (isNewWorkflow, workflowId, templateId) => {
        const spy = spyFetch();
        await createWorkflowDraft({ isNewWorkflow, workflowId, templateId });
        expect(spy).toHaveBeenCalledWith(`undefined/api/workflows/drafts`, {
          body: JSON.stringify({
            isNewWorkflow,
            workflowId,
            workflowVer: 0,
            templateId,
            templateVer: 0,
          }),
          ...options,
          method: 'POST',
        });
      },
    );
  });

  describe('updateWorkflowDraft,', () => {
    itProp('calls to update workflow drafts', [fc.record({ id: fc.string() }), fc.string()], async draft => {
      const spy = spyFetch();
      await updateWorkflowDraft(draft);
      expect(spy).toHaveBeenCalledWith(`undefined/api/workflows/drafts/${encodeURIComponent(draft.id)}`, {
        body: JSON.stringify({
          id: draft.id,
        }),
        ...options,
        method: 'PUT',
      });
    });
  });

  describe('publishWorkflowDraft,', () => {
    itProp('calls to update workflow drafts', [fc.object(), fc.string()], async draft => {
      const spy = spyFetch();
      await publishWorkflowDraft(draft);
      expect(spy).toHaveBeenCalledWith(
        `undefined/api/workflows/drafts/publish`,
        expect.objectContaining({ ...options, method: 'POST' }),
      );
    });
  });

  describe('deleteWorkflowDraft,', () => {
    itProp('calls to delete workflow drafts', [fc.record({ id: fc.string() }), fc.string()], async draft => {
      const spy = spyFetch();
      await deleteWorkflowDraft(draft);
      expect(spy).toHaveBeenCalledWith(
        `undefined/api/workflows/drafts/${encodeURIComponent(draft.id)}`,
        expect.objectContaining({ ...options, method: 'DELETE' }),
      );
    });
  });

  describe('getWorkflow,', () => {
    itProp('calls to get workflow with id given', [fc.string(), fc.string()], async id => {
      const spy = spyFetch();
      await getWorkflow(id);
      expect(spy).toHaveBeenCalledWith(
        `undefined/api/workflows/${encodeURIComponent(id)}`,
        expect.objectContaining({ ...options, method: 'GET' }),
      );
    });
  });

  describe('listWorkflowInstancesByStatus,', () => {
    itProp('calls to get list of workflow instance by status', [fc.string(), fc.object()], async (status, data) => {
      const spy = spyFetch();
      await listWorkflowInstancesByStatus({ status, data });
      expect(spy).toHaveBeenCalledWith(
        `undefined/api/workflows/instances/status/${status}`,
        expect.objectContaining({ ...options, method: 'POST', body: JSON.stringify(data) }),
      );
    });
  });

  describe('getWorkflowInstances,', () => {
    itProp('calls to get workflow instances', [fc.string(), fc.string()], async (id, ver) => {
      const spy = spyFetch();
      await getWorkflowInstances(id, ver);
      expect(spy).toHaveBeenCalledWith(
        `undefined/api/workflows/${encodeURIComponent(id)}/v/${ver}/instances`,
        expect.objectContaining({ ...options, method: 'GET' }),
      );
    });
  });

  describe('getWorkflowInstance,', () => {
    itProp(
      'calls to get workflow instance by id',
      [fc.string({ minLength: 1 }), fc.string({ minLength: 1 }), fc.string({ minLength: 1 })],
      async (workflowId, workflowVer, instanceId) => {
        const spy = spyFetch();
        await getWorkflowInstance(workflowId, workflowVer, instanceId);
        expect(spy).toHaveBeenCalledWith(
          `undefined/api/workflows/${encodeURIComponent(workflowId)}/v/${workflowVer}/instances/${encodeURIComponent(
            instanceId,
          )}`,
          expect.objectContaining({ ...options, method: 'GET' }),
        );
      },
    );
  });

  describe('triggerWorkflow,', () => {
    itProp(
      'calls to trigger workflow by id',
      [fc.string({ minLength: 1 }), fc.string({ minLength: 1 }), fc.object()],
      async (workflowId, workflowVer, data) => {
        const spy = spyFetch();
        await triggerWorkflow(workflowId, workflowVer, data);
        expect(spy).toHaveBeenCalledWith(
          `undefined/api/workflows/${encodeURIComponent(workflowId)}/v/${workflowVer}/trigger`,
          expect.objectContaining({ ...options, method: 'POST' }),
        );
      },
    );
  });

  describe('getWorkflowEventTriggers,', () => {
    itProp('calls to trigger workflow by id', [fc.string({ minLength: 1 }), fc.string()], async id => {
      const spy = spyFetch();
      await getWorkflowEventTriggers(id);
      expect(spy).toHaveBeenCalledWith(
        `undefined/api/workflows/${encodeURIComponent(id)}/event-triggers`,
        expect.objectContaining({ ...options, method: 'GET' }),
      );
    });
  });

  describe('deleteWorkflowEventTrigger,', () => {
    itProp(
      'calls to delete workflow event by id',
      [fc.string({ minLength: 1 }), fc.string({ minLength: 1 })],
      async (workflowId, triggerId) => {
        const spy = spyFetch();
        await deleteWorkflowEventTrigger(workflowId, triggerId);
        expect(spy).toHaveBeenCalledWith(
          `undefined/api/workflows/${encodeURIComponent(workflowId)}/event-triggers/${encodeURIComponent(triggerId)}`,
          expect.objectContaining({ ...options, method: 'DELETE' }),
        );
      },
    );
  });

  describe('createWorkflowEventTrigger,', () => {
    itProp(
      'calls to delete workflow event by id',
      [fc.string({ minLength: 1 }), fc.object()],
      async (workflowId, eventTrigger) => {
        const spy = spyFetch();
        await createWorkflowEventTrigger(workflowId, eventTrigger);
        expect(spy).toHaveBeenCalledWith(
          `undefined/api/workflows/${encodeURIComponent(workflowId)}/event-triggers`,
          expect.objectContaining({ ...options, method: 'POST' }),
        );
      },
    );
  });
});
