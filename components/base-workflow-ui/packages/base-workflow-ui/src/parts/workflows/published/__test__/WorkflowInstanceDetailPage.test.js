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
import WorkflowInstanceDetailPage from '../WorkflowInstanceDetailPage';

jest.mock('../../../workflow-common/ProgressPlaceholder');

describe('WorkflowInstanceDetailPage', () => {
  const workflowsStore = {
    load: jest.fn(),
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
              updatedAt: 'Feb 1, 1966 UTC',
              updatedBy: 'test-updatedBy',
              desc: 'test-desc',
              getInstance: jest.fn(() => {
                return {
                  ready: 'store-ready',
                  load: jest.fn(),
                  startHeartbeat: jest.fn(),
                  updatedAt: 'Feb 1, 1966 UTC',
                  updatedBy: 'test-updatedBy',
                  statusSummary: {
                    statusMsg: 'test-statusMsg',
                    statusLabel: 'test-statusLabel',
                    statusColor: 'red',
                    msgSpread: 'test-msgSpread',
                  },
                };
              }),
            };
          }),
        },
        getEventTriggersStore: jest.fn(() => {
          return { list: [], ready: 'store-ready', load: jest.fn(), startHeartbeat: jest.fn() };
        }),
        getInstanceStore: jest.fn(() => {
          return { ready: 'store-ready', load: jest.fn(), startHeartbeat: jest.fn() };
        }),
      };
    }),
  };
  const userDisplayName = {
    getDisplayName: jest.fn(() => {
      return 'test-userDisplayName';
    }),
    isSystem: jest.fn(() => {
      return true;
    }),
  };
  const match = { params: {} };

  beforeEach(() => {
    jest.spyOn(global.Date, 'now').mockImplementation(() => 1626365860332);
  });

  it('WorkflowInstanceDetailPage should renders correctly', () => {
    expect(
      renderer
        .create(
          <Provider workflowsStore={workflowsStore}>
            <WorkflowInstanceDetailPage.WrappedComponent
              workflowsStore={workflowsStore}
              userDisplayName={userDisplayName}
              match={match}
            />
          </Provider>,
        )
        .toJSON(),
    ).toMatchSnapshot();
  });
});
