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
import WorkflowTemplateStepEditor from '../WorkflowTemplateStepEditor';

jest.mock('../../../../workflow-common/drafts/edit/WorkflowCommonStepEditorCard');
jest.mock('../../../../workflow-common/drafts/edit/WorkflowCommonStepConfigEditor');
jest.mock('../../../../workflow-common/drafts/edit/WorkflowCommonStepDescEditor');
jest.mock('../../../../workflow-common/drafts/edit/WorkflowCommonStepPropsEditor');
jest.mock('../WorkflowTemplateStepConfigOverrideEditor');
jest.mock('../WorkflowTemplateStepPropsOverrideEditor');
describe('WorkflowTemplateStepEditor', () => {
  it('WorkflowTemplateStepEditor should renders correctly', () => {
    const onSave = jest.fn();
    const onDelete = jest.fn();
    const canDelete = true;
    const canMove = true;
    const stepEditor = {
      step: {},
      configOverrideForm: {
        errors: jest.fn(() => {
          return [];
        }),
      },
      configOverrideEdit: {},
    };
    const className = 'test-className';

    expect(
      renderer
        .create(
          <Provider>
            <WorkflowTemplateStepEditor
              onSave={onSave}
              onDelete={onDelete}
              canDelete={canDelete}
              canMove={canMove}
              stepEditor={stepEditor}
              className={className}
            />
          </Provider>,
        )
        .toJSON(),
    ).toMatchSnapshot();
  });
});
