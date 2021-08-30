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

import { isStoreReady } from '@aws-ee/base-ui/dist/models/BaseStore';

import {
  getWorkflow,
  getWorkflowEventTriggers,
  createWorkflowEventTrigger,
  deleteWorkflowEventTrigger,
} from '../../../helpers/api';
import { registerContextItems } from '../WorkflowsStore';

jest.mock('../../../helpers/api');

describe('WorkflowEventTriggersStore', () => {
  let store = null;
  const appContext = {};
  const wfId = 'wf-terminate-environment-sc';
  const wfVer = 1;
  const mockWorkflow = [{ id: wfId, v: wfVer, runSpec: {}, stepsOrderChanged: false }];
  const rawData = [
    {
      id: 'trigger1',
      wf: wfId,
      workflowVer: wfVer,
      eventPattern: 'testPattern',
      createdAt: '1',
    },
    {
      id: 'trigger2',
      wf: wfId,
      workflowVer: wfVer,
      eventPattern: 'testPattern2',
      createdAt: '2',
    },
  ];

  beforeEach(async () => {
    await registerContextItems(appContext);
    store = appContext.workflowsStore.getWorkflowStore(wfId);
    store.cleanup();
    getWorkflow.mockResolvedValueOnce(mockWorkflow);
    await store.load(); // Loading the workflow

    getWorkflowEventTriggers.mockResolvedValueOnce(rawData);
    store = store.getEventTriggersStore();
    store.cleanup();
    await store.load(); // Loading the workflow event triggers store
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('actions and views', () => {
    // ============= views

    it('should return the workflow', async () => {
      const workflow = store.workflow;
      expect(workflow.id).toEqual(wfId);
    });

    it('should return the event triggers', async () => {
      const triggers = store.eventTriggers || [];
      expect(triggers.length).toEqual(2);

      expect(triggers[0].id).toEqual(rawData[0].id);
      expect(triggers[1].id).toEqual(rawData[1].id);
    });

    it('should return total', async () => {
      expect(store.total).toEqual(2);
    });

    it('should not be empty', async () => {
      expect(store.empty).toEqual(false);
    });

    it('should return a list', async () => {
      const triggers = store.list || [];
      expect(triggers.length).toEqual(2);

      // the triggers are sorted by createdBy
      expect(triggers[1].id).toEqual(rawData[0].id);
      expect(triggers[0].id).toEqual(rawData[1].id);
    });

    it('should return empty triggers if workflow is not there', async () => {
      const context = {};
      await registerContextItems(context);
      const workflowStore = context.workflowsStore.getWorkflowStore(wfId);
      const triggersStore = workflowStore.getEventTriggersStore();

      expect(triggersStore.eventTriggers).toEqual([]);
    });

    // ============= actions

    it('should cleanup', async () => {
      store.cleanup(); // Clean up does not do much other than call the base store cleanup
      expect(store.workflowId).toEqual(wfId);
    });

    it('should load parent if not loaded', async () => {
      const context = {};
      await registerContextItems(context);
      const workflowStore = context.workflowsStore.getWorkflowStore(wfId);
      getWorkflow.mockResolvedValueOnce(mockWorkflow);
      getWorkflowEventTriggers.mockResolvedValueOnce(rawData);

      const triggersStore = workflowStore.getEventTriggersStore();
      await triggersStore.load(); // Loading the triggers

      expect(isStoreReady(workflowStore)).toBe(true);
    });

    it('should throw if parent does not have a workflow', async () => {
      const context = {};
      await registerContextItems(context);
      const workflowStore = context.workflowsStore.getWorkflowStore(wfId);

      getWorkflowEventTriggers.mockResolvedValueOnce(rawData);
      const triggersStore = workflowStore.getEventTriggersStore();

      await expect(triggersStore.load()).rejects.toThrow();
    });

    it('should not created triggers if no triggered are given', async () => {
      await store.create();
      expect(createWorkflowEventTrigger).not.toHaveBeenCalled();
    });

    it('should create triggers', async () => {
      createWorkflowEventTrigger.mockImplementationOnce(async (id, data) => {
        if (id !== wfId) return undefined;
        return { ...data, id: 'trigger3', createdAt: '3', workflowVer: wfVer };
      });

      await store.create({ eventPattern: 'pattern3' });
      expect(createWorkflowEventTrigger).toHaveBeenCalled();
      expect(store.eventTriggers[2].eventPattern).toEqual('pattern3');
    });

    it('should delete triggers', async () => {
      await store.delete('trigger2');
      expect(deleteWorkflowEventTrigger).toHaveBeenCalled();
      expect(store.total).toBe(1);
    });

    it('should not delete if event does not exist', async () => {
      await store.delete('do not exist');
      expect(deleteWorkflowEventTrigger).not.toHaveBeenCalled();
    });
  });
});
