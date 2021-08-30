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
import WorkflowDraftsList from '../WorkflowDraftsList';

jest.mock('../../../workflow-common/drafts/WorkflowCommonDraftCard');
jest.mock('../../../workflow-common/ProgressPlaceholder');
jest.mock('../CreateWorkflowDraft');
jest.mock('../../../workflow-templates/WorkflowTemplateCardTabs');

describe('WorkflowDraftsList', () => {
  const workflowDraftsStore = { ready: 'store-ready', load: jest.fn(), startHeartbeat: jest.fn() };
  const stepTemplatesStore = { ready: 'store-ready', load: jest.fn(), startHeartbeat: jest.fn() };
  it('WorkflowDraftsList should renders correctly', () => {
    expect(
      renderer
        .create(
          <Provider workflowDraftsStore={workflowDraftsStore} stepTemplatesStore={stepTemplatesStore}>
            <WorkflowDraftsList.WrappedComponent
              workflowDraftsStore={workflowDraftsStore}
              stepTemplatesStore={stepTemplatesStore}
            />
          </Provider>,
        )
        .toJSON(),
    ).toMatchSnapshot();
  });
});
