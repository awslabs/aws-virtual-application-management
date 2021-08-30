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

import WorkflowStepEditor from '../WorkflowStepEditor';

jest.mock('../../../../workflow-common/drafts/edit/WorkflowCommonStepEditorCard');
jest.mock('../../../../workflow-common/drafts/edit/WorkflowCommonStepDescEditor');
jest.mock('../../../../workflow-common/drafts/edit/WorkflowCommonStepPropsEditor');
jest.mock('../../../../workflow-common/drafts/edit/WorkflowCommonStepConfigEditor');

describe('WorkflowDraftEditor', () => {
  const workflowDraftsStore = { load: jest.fn(), ready: 'store-ready' };
  const workflowTemplatesStore = { load: jest.fn(), ready: 'store-ready' };
  const stepTemplatesStore = { load: jest.fn(), reday: 'store-ready' };
  const stepEditor = { step: [] };
  const className = 'test-className';
  const onSave = jest.fn();
  const onDelete = jest.fn();
  const canDelete = jest.fn();
  const canMove = jest.fn();
  it('WorkflowDraftEditor should renders correctly', () => {
    expect(
      renderer
        .create(
          <Provider
            workflowDraftsStore={workflowDraftsStore}
            stepTemplatesStore={stepTemplatesStore}
            workflowTemplatesStore={workflowTemplatesStore}
          >
            <WorkflowStepEditor
              workflowDraftsStore={workflowDraftsStore}
              stepTemplatesStore={stepTemplatesStore}
              workflowTemplatesStore={workflowTemplatesStore}
              onSave={onSave}
              onDelete={onDelete}
              canDelete={canDelete}
              canMove={canMove}
              className={className}
              stepEditor={stepEditor}
            />
          </Provider>,
        )
        .toJSON(),
    ).toMatchSnapshot();
  });
});
