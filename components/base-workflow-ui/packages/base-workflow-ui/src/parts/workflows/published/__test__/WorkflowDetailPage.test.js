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
import WorkflowDetailPage from '../WorkflowDetailPage';

jest.mock('../../../workflow-common/ProgressPlaceholder');
jest.mock('../../../workflow-common/component-states/WorkflowCommonCardState');
jest.mock('../WorkflowDetailTabs');

describe('WorkflowDetailPage', () => {
  const userDisplayName = {
    isSystem: jest.fn(),
    getDisplayName: jest.fn(() => {
      return 'test-getDisplayName';
    }),
  };
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
            };
          }),
        },
      };
    }),
  };
  const match = { params: {} };

  beforeEach(() => {
    jest.spyOn(global.Date, 'now').mockImplementation(() => 1626365860332);
  });

  it('WorkflowDetailPage should renders correctly', () => {
    expect(
      renderer
        .create(
          <Provider workflowsStore={workflowsStore}>
            <WorkflowDetailPage.WrappedComponent
              match={match}
              workflowsStore={workflowsStore}
              userDisplayName={userDisplayName}
            />
          </Provider>,
        )
        .toJSON(),
    ).toMatchSnapshot();
  });
});
