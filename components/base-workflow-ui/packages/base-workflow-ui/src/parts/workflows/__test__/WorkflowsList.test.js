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
import WorkflowsList from '../WorkflowsList';

jest.mock('../published/WorkflowPublishedList');
jest.mock('../drafts/WorkflowDraftsList');
jest.mock('@aws-ee/base-ui/dist/parts/documentation-client/DocumentationClient');

describe('WorkflowsList', () => {
  const workflowDraftsStore = { load: jest.fn(), ready: 'store-ready' };
  const stepTemplatesStore = { load: jest.fn(), ready: 'store-ready' };
  const workflowsStore = { load: jest.fn(), reday: 'store-ready' };
  it('WorkflowsList should renders correctly', () => {
    const userDisplayName = 'test-userDisplayName';
    expect(
      renderer
        .create(
          <Provider
            workflowDraftsStore={workflowDraftsStore}
            stepTemplatesStore={stepTemplatesStore}
            workflowsStore={workflowsStore}
          >
            <WorkflowsList.WrappedComponent
              workflowDraftsStore={workflowDraftsStore}
              stepTemplatesStore={stepTemplatesStore}
              workflowsStore={workflowsStore}
              userDisplayName={userDisplayName}
            />
          </Provider>,
        )
        .toJSON(),
    ).toMatchSnapshot();
  });
});
