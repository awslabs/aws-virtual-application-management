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

import React from 'react';
import renderer from 'react-test-renderer';
import { Provider } from 'mobx-react';
import WorkflowEventTriggersList from '../WorkflowEventTriggersList';

jest.mock('../CreateWorkflowEventTrigger');
jest.mock('../../../workflow-common/ProgressPlaceholder');

describe('WorkflowEventTriggersList', () => {
  const workflowVersion = 1;
  const workflowsStore = {
    getWorkflowStore: jest.fn(() => {
      return {
        ready: 'store-ready',
        load: jest.fn(),
        startHeartbeat: jest.fn(),
        workflow: {
          versionNumbers: [1],
          getVersion: jest.fn(() => {
            return {
              id: 'test-id',
              title: 'test-title',
              updatedAt: 'test-updatedAt',
              updatedBy: 'test-updatedBy',
              desc: 'test-desc',
            };
          }),
        },
        getEventTriggersStore: jest.fn(() => {
          return { list: [], ready: 'store-ready', load: jest.fn(), startHeartbeat: jest.fn() };
        }),
      };
    }),
  };
  const userDisplayName = 'test-userDisplayName';

  it('WorkflowEventTriggersList should renders correctly', () => {
    expect(
      renderer
        .create(
          <Provider workflowsStore={workflowsStore}>
            <WorkflowEventTriggersList.WrappedComponent
              workflowVersion={workflowVersion}
              workflowsStore={workflowsStore}
              userDisplayName={userDisplayName}
            />
          </Provider>,
        )
        .toJSON(),
    ).toMatchSnapshot();
  });
});
