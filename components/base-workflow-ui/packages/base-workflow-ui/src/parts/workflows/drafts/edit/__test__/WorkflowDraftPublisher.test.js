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

import WorkflowDraftPublisher from '../WorkflowDraftPublisher';

jest.mock('../../../../workflow-common/component-states/WorkflowCommonCardState');
jest.mock('../../../../workflow-templates/WorkflowTemplateCardTabs');

describe('WorkflowDraftPublisher', () => {
  const workflowDraftsStore = { load: jest.fn(), ready: 'store-ready' };
  const workflowTemplatesStore = { load: jest.fn(), ready: 'store-ready' };
  const stepTemplatesStore = { load: jest.fn(), reday: 'store-ready' };
  const uiEventBus = { fireEvent: jest.fn() };
  const onCancel = jest.fn();
  const editor = { previousPage: jest.fn(), draft: {}, version: { id: 'test-version-id' } };
  it('WorkflowDraftMetaEditor should renders correctly', () => {
    expect(
      renderer
        .create(
          <Provider
            workflowDraftsStore={workflowDraftsStore}
            stepTemplatesStore={stepTemplatesStore}
            workflowTemplatesStore={workflowTemplatesStore}
          >
            <WorkflowDraftPublisher.WrappedComponent
              workflowDraftsStore={workflowDraftsStore}
              stepTemplatesStore={stepTemplatesStore}
              workflowTemplatesStore={workflowTemplatesStore}
              uiEventBus={uiEventBus}
              onCancel={onCancel}
              editor={editor}
            />
          </Provider>,
        )
        .toJSON(),
    ).toMatchSnapshot();
  });
});
