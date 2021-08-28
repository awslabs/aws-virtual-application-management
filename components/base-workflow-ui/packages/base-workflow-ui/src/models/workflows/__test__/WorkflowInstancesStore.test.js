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

import _ from 'lodash';
import { isStoreReady } from '@aws-ee/base-ui/dist/models/BaseStore';

import { getWorkflow, getWorkflowInstances, triggerWorkflow } from '../../../helpers/api';
import { registerContextItems } from '../WorkflowsStore';

jest.mock('../../../helpers/api');

describe('WorkflowInstancesStore', () => {
  let store = null;
  const appContext = {};
  const wfId = 'wf-terminate-environment-sc';
  const wfVer = 1;
  const mockWorkflow = [{ id: wfId, v: wfVer, runSpec: {}, stepsOrderChanged: false }];
  const instanceId = 'gwQN4HmrapcSzbRPgVsP4';
  const fastHeartbeat = 5 * 1000;
  const slowHeartbeat = 300 * 1000;
  const rawData = [
    {
      workflow: {
        instanceTtl: 30,
        stepsOrderChanged: true,
        workflowTemplateId: 'wt-empty',
        runSpec: { size: 'small', target: 'stepFunctions' },
        v: 1,
        builtin: true,
        id: 'wf-terminate-environment-sc',
        workflowTemplateVer: 1,
        title: 'Terminate AWS Service Catalog based Environment',
      },
      runSpec: { size: 'small', target: 'stepFunctions' },
      wfVer: 1,
      ttl: 1611439245,
      createdAt: '2020-12-24T22:00:45.828Z',
      updatedBy: 'u-BrYopYtW66VDBw_DWNKBs',
      createdBy: 'u-BrYopYtW66VDBw_DWNKBs',
      wfId: 'wf-terminate-environment-sc',
      wf: 'wf-terminate-environment-sc_1',
      updatedAt: '2020-12-24T22:03:54.486Z',
      input: {
        envName: 'Workspace1',
      },
      stStatuses: [{ endTime: '2020-12-24T22:03:54.450Z', startTime: '2020-12-24T22:00:46.359Z', status: 'done' }],
      wfStatus: 'done',
      id: instanceId,
    },
  ];

  const triggerResponse = {
    instance: {
      workflow: {
        instanceTtl: 30,
        stepsOrderChanged: true,
        workflowTemplateId: 'wt-empty',
        runSpec: { size: 'small', target: 'stepFunctions' },
        selectedSteps: [
          {
            stepTemplateId: 'st-bulk-reachability-check',
            configs: {},
            stepTemplateVer: 1,
            skippable: true,
            id: 'wf-step_1_1574277702222_97',
            title: 'Check Data Source Reachability',
          },
        ],
        hidden: false,
        v: wfVer,
        builtin: true,
        id: wfId,
        workflowTemplateVer: 1,
        title: 'Bulk Reachability Check',
      },
      runSpec: { size: 'small', target: 'stepFunctions' },
      wfVer,
      createdAt: '2021-01-16T15:43:48.349Z',
      ttl: 1613403828,
      updatedBy: 'u-BrYopYtW',
      createdBy: 'u-BrYopYtW',
      wfId,
      wf: 'wf-bulk-reachability-check_1',
      updatedAt: '2021-01-16T15:43:48.349Z',
      input: {},
      stStatuses: [{ status: 'not_started' }],
      id: 'kqJpfZ6ULAjxXJWxV72ug',
      wfStatus: 'not_started',
    },
    runSpec: { size: 'small', target: 'stepFunctions' },
    executionArn: 'arn:aws:states:us-east-1:123456789012:execution:kqJpfZ6ULAjxXg123455',
  };

  beforeEach(async () => {
    await registerContextItems(appContext);
    store = appContext.workflowsStore.getWorkflowStore(wfId);
    store.cleanup();
    getWorkflow.mockResolvedValueOnce(mockWorkflow);
    await store.load(); // Loading the workflow

    getWorkflowInstances.mockResolvedValueOnce(rawData);
    store = store.getInstancesStore(wfId, wfVer);
    store.cleanup();
    await store.load(); // Loading the workflow instances
  });

  describe('actions and views', () => {
    // ============= views

    it('should return the workflow version', async () => {
      const versionObj = store.version;
      expect(versionObj.id).toEqual(wfId);
      expect(versionObj.v).toEqual(wfVer);
    });

    it('should return the workflow instances', async () => {
      const instances = store.instances || [];
      expect(instances.length).toEqual(1);

      const instance = instances[0];
      expect(instance.id).toEqual(instanceId);
    });

    it('should return total', async () => {
      expect(store.total).toEqual(1);
    });

    it('should not be empty', async () => {
      expect(store.empty).toEqual(false);
    });

    it('should return a list', async () => {
      const instances = store.list || [];
      expect(instances.length).toEqual(1);

      const instance = instances[0];
      expect(instance.id).toEqual(instanceId);
    });

    it('should return a workflow instance', async () => {
      const instance = store.getInstance(instanceId);

      expect(instance).toBeDefined();
      expect(instance.id).toEqual(instanceId);
      expect(instance.wfVer).toEqual(wfVer);
    });

    it('should have the workflow instance', async () => {
      expect(store.hasInstance(instanceId)).toEqual(true);
    });

    it('should return undefined if parent does not have the workflow', async () => {
      const context = {};
      await registerContextItems(context);
      const workflowStore = context.workflowsStore.getWorkflowStore(wfId);
      const instancesStore = workflowStore.getInstancesStore(wfId, wfVer);

      expect(instancesStore.version).toBeUndefined();
    });

    // ============= actions

    it('should be able to slow tick period', async () => {
      store.setSlowTickPeriod();
      expect(store.tickPeriod).toEqual(slowHeartbeat);
    });

    it('should be able to speed up tick period', async () => {
      store.setFastTickPeriod();
      expect(store.tickPeriod).toEqual(fastHeartbeat);
    });

    it('should cleanup', async () => {
      store.cleanup(); // Clean up does not do much other than call the base store cleanup
      expect(store.workflowId).toEqual(wfId);
    });

    it('should trigger workflow', async () => {
      triggerWorkflow.mockResolvedValueOnce(triggerResponse);
      const result = await store.triggerWorkflow({ input: {} });
      expect(store.hasInstance(result.instance.id)).toBe(true);
    });

    it('should load parent if not loaded', async () => {
      const workflowsStore = appContext.workflowsStore.getWorkflowStore(wfId);
      workflowsStore.cleanup(); // Reset the state
      getWorkflow.mockResolvedValueOnce(mockWorkflow);
      getWorkflowInstances.mockResolvedValueOnce(rawData);

      store = workflowsStore.getInstancesStore(wfId, wfVer);
      await store.load(); // Loading the workflow instances

      expect(isStoreReady(workflowsStore)).toBe(true);
    });

    it('should speed up heart beat if there are pending instances', async () => {
      const data = _.cloneDeep(rawData);
      data[0].wfStatus = 'in_progress';
      getWorkflowInstances.mockResolvedValueOnce(data);
      await store.load(); // Loading the workflow instances

      expect(store.tickPeriod).toEqual(fastHeartbeat);
    });

    it('should slow down heart beat if no pending instances after a workflow is triggered', async () => {
      const data = _.cloneDeep(triggerResponse);
      data.instance.wfStatus = 'done';
      triggerWorkflow.mockResolvedValueOnce(data);
      await store.triggerWorkflow({ input: {} });

      expect(store.tickPeriod).toEqual(slowHeartbeat);
    });

    it('should throw if parent does not have a workflow version', async () => {
      const workflowStore = appContext.workflowsStore.getWorkflowStore(wfId);

      getWorkflowInstances.mockResolvedValueOnce(rawData);
      store.cleanup();
      const instancesStore = workflowStore.getInstancesStore(wfId, 3); // 3 is a wf version that does not exist

      await expect(instancesStore.load()).rejects.toThrow();
    });

    it('should throw if parent does not have a workflow version when triggering workflow', async () => {
      const workflowStore = appContext.workflowsStore.getWorkflowStore(wfId);

      getWorkflowInstances.mockResolvedValueOnce(rawData);
      store.cleanup();
      const instancesStore = workflowStore.getInstancesStore(wfId, 3); // 3 is a wf version that does not exist

      triggerWorkflow.mockResolvedValueOnce(triggerResponse);
      await expect(instancesStore.triggerWorkflow({ input: {} })).rejects.toThrow();
    });

    it('should return empty array when listing instances if workflow version does not exist', async () => {
      const workflowStore = appContext.workflowsStore.getWorkflowStore(wfId);

      getWorkflowInstances.mockResolvedValueOnce(rawData);
      store.cleanup();
      const instancesStore = workflowStore.getInstancesStore(wfId, 3); // 3 is a wf version that does not exist
      expect(instancesStore.instances).toEqual([]);
    });
  });
});
