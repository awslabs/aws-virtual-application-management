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

import { getWorkflow, getWorkflowInstance } from '../../../helpers/api';
import { registerContextItems } from '../WorkflowsStore';

jest.mock('../../../helpers/api');

describe('WorkflowInstanceStore', () => {
  let store = null;
  const appContext = {};
  const wfId = 'wf-terminate-environment-sc';
  const wfVer = 1;
  const mockWorkflow = [{ id: wfId, v: wfVer, runSpec: {}, stepsOrderChanged: false }];
  const instanceId = 'gwQN4HmrapcSzbRPgVsP4';
  const fastHeartbeat = 5 * 1000;
  const slowHeartbeat = 300 * 1000;
  const rawData = {
    workflow: {
      instanceTtl: 30,
      stepsOrderChanged: true,
      workflowTemplateId: 'wt-empty',
      runSpec: { size: 'small', target: 'stepFunctions' },
      selectedSteps: [
        {
          stepTemplateId: 'st-ds-account-status-change',
          configs: {},
          stepTemplateVer: 1,
          skippable: true,
          id: 'wf-step_1_1574272202222_97',
          title: 'Check Data Source Study Reachability',
        },
      ],
      hidden: false,
      v: wfVer,
      builtin: true,
      id: wfId,
      workflowTemplateVer: 1,
      title: 'Data Source Account Status Change',
    },
    runSpec: { size: 'small', target: 'stepFunctions' },
    wfVer: 1,
    createdAt: '2021-01-16T23:22:45.206Z',
    ttl: 1613431365,
    updatedBy: '_system_',
    createdBy: '_system_',
    wfId: 'wf-ds-account-status-change',
    wf: 'wf-ds-account-status-change_1',
    updatedAt: '2021-01-16T23:22:48.351Z',
    input: {
      type: 'dsAccount',
      id: '123345678901',
    },
    stStatuses: [{ endTime: '2021-01-16T23:22:48.314Z', startTime: '2021-01-16T23:22:47.375Z', status: 'done' }],
    id: instanceId,
    wfStatus: 'done',
  };

  beforeEach(async () => {
    await registerContextItems(appContext);
    const workflowStore = appContext.workflowsStore.getWorkflowStore(wfId);
    workflowStore.cleanup();
    getWorkflow.mockResolvedValueOnce(mockWorkflow);
    await workflowStore.load(); // Loading the workflow

    getWorkflowInstance.mockResolvedValueOnce(rawData);
    store = workflowStore.getInstanceStore(wfVer, instanceId);
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

    it('should return undefined if parent does not have the workflow', async () => {
      const context = {};
      await registerContextItems(context);
      const workflowStore = context.workflowsStore.getWorkflowStore(wfId);
      const instanceStore = workflowStore.getInstanceStore(wfVer, instanceId);

      expect(instanceStore.version).toBeUndefined();
    });

    // ============= actions

    it('should load parent if not loaded', async () => {
      const context = {};
      await registerContextItems(context);
      const workflowStore = context.workflowsStore.getWorkflowStore(wfId);
      getWorkflow.mockResolvedValueOnce(mockWorkflow);
      getWorkflowInstance.mockResolvedValueOnce(rawData);

      const instanceStore = workflowStore.getInstanceStore(wfVer, instanceId);
      await instanceStore.load(); // Loading the workflow instance

      expect(isStoreReady(workflowStore)).toBe(true);
    });

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

    it('should speed up heart beat if there are pending instances', async () => {
      const data = _.cloneDeep(rawData);
      data.wfStatus = 'in_progress';
      getWorkflowInstance.mockResolvedValueOnce(data);
      await store.load(); // Loading the workflow instances

      expect(store.tickPeriod).toEqual(fastHeartbeat);
    });

    it('should throw if parent does not have a workflow version', async () => {
      const context = {};
      await registerContextItems(context);
      const workflowStore = context.workflowsStore.getWorkflowStore(wfId);
      getWorkflow.mockResolvedValueOnce(mockWorkflow);
      await workflowStore.load(); // Loading the workflow

      const instanceStore = workflowStore.getInstanceStore(4, instanceId); // 4 is  workflow version that does not exist
      getWorkflowInstance.mockResolvedValueOnce(rawData);

      await expect(instanceStore.load()).rejects.toThrow();
    });
  });
});
