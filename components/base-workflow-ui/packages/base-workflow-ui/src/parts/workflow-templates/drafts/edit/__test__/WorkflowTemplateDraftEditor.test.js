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
import WorkflowTemplateDraftEditor from '../WorkflowTemplateDraftEditor';

describe('WorkflowTemplateDraftEditor', () => {
  it('WorkflowTemplateDraftEditor should renders correctly', () => {
    const workflowTemplateDraftsStore = {
      ready: 'store-ready',
      load: jest.fn(),
      startHeartbeat: jest.fn(),
      list: [],
      getDraft: jest.fn(() => {
        return { template: {} };
      }),
      hasDraft: jest.fn(),
    };
    const stepTemplatesStore = {
      ready: 'store-ready',
      load: jest.fn(),
      startHeartbeat: jest.fn(),
      list: [],
      getDraft: jest.fn(() => {
        return { template: {} };
      }),
      hasDraft: jest.fn(),
    };
    const className = 'test-className';
    const match = { params: { test: 'test' } };
    const userDisplayName = 'test-userDisplayName';
    expect(
      renderer
        .create(
          <Provider workflowTemplateDraftsStore={workflowTemplateDraftsStore} stepTemplatesStore={stepTemplatesStore}>
            <WorkflowTemplateDraftEditor.WrappedComponent
              workflowTemplateDraftsStore={workflowTemplateDraftsStore}
              stepTemplatesStore={stepTemplatesStore}
              className={className}
              match={match}
              userDisplayName={userDisplayName}
            />
          </Provider>,
        )
        .toJSON(),
    ).toMatchSnapshot();
  });
});
