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

import WorkflowDraftEditor from '../WorkflowDraftEditor';

jest.mock('../../../../workflow-common/ProgressPlaceholder');
jest.mock('../../../../../models/workflows/drafts/edit/WorkflowDraftEditor');
jest.mock('../../../../workflow-common/drafts/edit/WorkflowCommonDraftStepsEditor');
jest.mock('../WorkflowStepEditor');
jest.mock('../WorkflowDraftMetaEditor');
jest.mock('../WorkflowDraftPublisher');

describe('WorkflowDraftEditor', () => {
  const workflowDraftsStore = { load: jest.fn(), ready: 'store-ready' };
  const workflowTemplatesStore = { load: jest.fn(), ready: 'store-ready' };
  const stepTemplatesStore = { load: jest.fn(), reday: 'store-ready' };
  const userDisplayName = 'test-userDisplayName';
  const className = 'test-className';
  const match = { params: {} };
  it('WorkflowDraftEditor should renders correctly', () => {
    expect(
      renderer
        .create(
          <Provider
            workflowDraftsStore={workflowDraftsStore}
            stepTemplatesStore={stepTemplatesStore}
            workflowTemplatesStore={workflowTemplatesStore}
          >
            <WorkflowDraftEditor.WrappedComponent
              workflowDraftsStore={workflowDraftsStore}
              stepTemplatesStore={stepTemplatesStore}
              workflowTemplatesStore={workflowTemplatesStore}
              userDisplayName={userDisplayName}
              className={className}
              match={match}
            />
          </Provider>,
        )
        .toJSON(),
    ).toMatchSnapshot();
  });
});
