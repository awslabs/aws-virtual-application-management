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
import { getParent } from 'mobx-state-tree';
import { BaseStore, isStoreReady } from '@aws-ee/base-ui/dist/models/BaseStore';

import { getWorkflowEventTriggers, deleteWorkflowEventTrigger, createWorkflowEventTrigger } from '../../helpers/api';

// ==================================================================
// WorkflowEventTriggersStore
// ==================================================================
const WorkflowEventTriggersStore = BaseStore.named('WorkflowEventTriggersStore')
  .props({
    workflowId: '',
    tickPeriod: 300 * 1000, // 5 minutes
  })

  .actions(self => {
    // save the base implementation of cleanup
    const superCleanup = self.cleanup;

    return {
      async doLoad() {
        const parent = getParent(self, 2);
        if (!isStoreReady(parent)) {
          await parent.load();
        }
        const eventTriggers = await getWorkflowEventTriggers(self.workflowId);
        self.runInAction(() => {
          const workflow = self.workflow;
          if (!workflow) throw new Error(`Workflow "${self.workflowId}" does not exist`);
          workflow.setEventTriggers(eventTriggers);
        });
      },

      async delete(id) {
        const eventTrigger = self.workflow.eventTriggers.find(trigger => {
          return trigger.id === id;
        });

        if (_.isUndefined(eventTrigger)) {
          return;
        }

        await deleteWorkflowEventTrigger(self.workflow.id, eventTrigger.id);
        self.runInAction(() => {
          self.workflow.deleteEventTrigger(eventTrigger);
        });
      },

      async create(data) {
        if (_.isEmpty(data)) {
          return;
        }

        const newEventTrigger = await createWorkflowEventTrigger(self.workflow.id, data);
        self.runInAction(() => {
          self.workflow.addEventTrigger(newEventTrigger);
        });
      },

      cleanup: () => {
        superCleanup();
      },
    };
  })

  .views(self => ({
    get eventTriggers() {
      const workflow = self.workflow;
      if (!workflow) return [];
      return workflow.eventTriggers;
    },

    get workflow() {
      const parent = getParent(self, 2);
      return parent.workflow;
    },

    get empty() {
      return self.eventTriggers.length === 0;
    },

    get total() {
      return self.eventTriggers.length;
    },

    get list() {
      const result = self.eventTriggers.slice();

      return _.reverse(_.sortBy(result, ['createdAt']));
    },
  }));

// Note: Do NOT register this in the app context, if you want to gain access to an instance
//       use WorkflowStore.getWorkflowEventTriggersStore()
export default WorkflowEventTriggersStore;
