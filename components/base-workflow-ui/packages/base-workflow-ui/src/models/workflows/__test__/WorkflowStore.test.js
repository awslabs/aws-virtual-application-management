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
import { getWorkflow } from '../../../helpers/api';
import { registerContextItems } from '../WorkflowsStore';

jest.mock('../../../helpers/api');

describe('WorkflowStore', () => {
  let store = null;
  const appContext = {};
  const wfId = 'wf-ds-account-status-change';
  const wfVer = 1;
  const selectedSteps = [
    {
      configOverrideOption: { allowed: [] },
      stepTemplateId: 'st-ds-account-status-change',
      configs: {},
      stepTemplateVer: 1,
      skippable: true,
      id: 'wf-step_1_1574272202211_97',
      title: 'Check Data Source Study Reachability',
      desc: 'Check Data Source Study Reachability\n',
      propsOverrideOption: { allowed: ['title', 'desc', 'skippable'] },
    },
  ];
  const mockWorkflow = [
    {
      rev: 0,
      runSpec: { size: 'small', target: 'stepFunctions' },
      // builtin: true,
      workflowTemplateId: 'wt-empty',
      createdAt: '2020-12-14T23:24:54.490Z',
      updatedBy: '_system_',
      createdBy: '_system_',
      selectedSteps,
      desc: 'Check all study reachability for status changed DS Account\n',
      instanceTtl: 30,
      workflowTemplateVer: 1,
      v: wfVer,
      updatedAt: '2020-12-14T23:24:54.490Z',
      id: wfId,
      stepsOrderChanged: true,
      // hidden: false,
      title: 'Data Source Account Status Change',
    },
  ];

  const expectSameWorkflow = (wf1VerObj, wf2VerObj) => {
    expect(_.omit(wf1VerObj, ['instancesMap', 'selectedSteps'])).toEqual(_.omit(wf2VerObj, ['selectedSteps']));
  };

  beforeEach(async () => {
    await registerContextItems(appContext);
    store = appContext.workflowsStore.getWorkflowStore(wfId);
    getWorkflow.mockResolvedValueOnce(mockWorkflow);
    await store.load();
  });

  describe('get workflow', () => {
    it('should return the detailed workflow information', async () => {
      const wf = store.workflow;
      expectSameWorkflow(wf.versions[0], mockWorkflow[0]);
    });
  });

  describe('get instances store', () => {
    it('should return the instances store', async () => {
      const instancesStore = store.getInstancesStore(wfId, wfVer);
      const wf = instancesStore.version;
      expect(instancesStore).toBeDefined();
      expectSameWorkflow(wf, mockWorkflow[0]);
    });

    it('should return same instances store if one already exists for the workflow version', async () => {
      const instancesStore1 = store.getInstancesStore(wfId, wfVer); // Newly created
      const instancesStore2 = store.getInstancesStore(wfId, wfVer); // Existing
      const wf1 = instancesStore1.version;
      const wf2 = instancesStore2.version;
      expect(instancesStore1).toEqual(instancesStore2);
      expect(wf1).toEqual(wf2);
    });
  });

  describe('get instance store', () => {
    it('should return the instance store for the given instance', async () => {
      const instanceStore = store.getInstanceStore(wfVer, '123');
      const wf = instanceStore.version;
      expect(instanceStore).toBeDefined();
      expectSameWorkflow(wf, mockWorkflow[0]);
    });

    it('should return same instance store if one already exists for the workflow instance', async () => {
      const instanceStore1 = store.getInstanceStore(wfVer, '1234'); // Newly created
      const instanceStore2 = store.getInstanceStore(wfVer, '1234'); // Existing
      const wf1 = instanceStore1.version;
      const wf2 = instanceStore2.version;
      expect(instanceStore1).toEqual(instanceStore2);
      expect(wf1).toEqual(wf2);
    });
  });

  describe('get event trigger store', () => {
    it('should return the trigger store', async () => {
      const triggerStore = store.getEventTriggersStore();
      const wf = triggerStore.workflow;
      expect(triggerStore).toBeDefined();
      expectSameWorkflow(wf.versions[0], mockWorkflow[0]);
    });

    it('should return same trigger store if one already exists for the workflow', async () => {
      const triggerStore1 = store.getEventTriggersStore(); // Newly created
      const triggerStore2 = store.getEventTriggersStore(); // Existing
      const wf1 = triggerStore1.workflow;
      const wf2 = triggerStore2.workflow;
      expect(triggerStore1).toEqual(triggerStore2);
      expect(wf1).toEqual(wf2);
    });
  });

  it('should clear all references to its stores after cleanup', async () => {
    // First lets cause the store to create its child stores
    store.getEventTriggersStore();
    store.getInstancesStore(wfId, wfVer);
    store.getInstanceStore(wfVer, '1234');

    // All child stores should be not be empty
    expect(store.instancesStores.size).toBe(1);
    expect(store.instanceStores.size).toBe(1);
    expect(store.eventTriggersStore.size).toBe(1);

    // Clean all child stores
    await store.cleanup();

    // All child stores should be empty
    expect(store.instancesStores.size).toBe(0);
    expect(store.instanceStores.size).toBe(0);
    expect(store.eventTriggersStore.size).toBe(0);
  });
});
