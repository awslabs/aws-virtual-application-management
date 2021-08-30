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
import { shallow } from 'enzyme';
import renderer from 'react-test-renderer';
import { Provider } from 'mobx-react';
import WorkflowCommonStepDescEditor from '../WorkflowCommonStepDescEditor';

describe('WorkflowCommonStepDescEditor', () => {
  // eslint-disable-next-line no-unused-vars
  let component = null;
  let wrapper = null;
  const onCancel = jest.fn();
  const editor = { version: { selectedSteps: [] }, addStep: jest.fn(), stepEditorsEditing: jest.fn() };
  const stepEditor = { step: { desc: 'test-desc' } };
  const stepTemplatesStore = { load: jest.fn() };
  beforeEach(() => {
    // Render component
    wrapper = shallow(
      <Provider stepTemplatesStore={stepTemplatesStore}>
        <WorkflowCommonStepDescEditor
          editor={editor}
          stepEditor={stepEditor}
          onCancel={onCancel}
          StepTemplatesStore={stepTemplatesStore}
        />
      </Provider>,
    );
    // Get instance of the component
    component = wrapper.instance();
  });
  it('renders correctly', () =>
    expect(
      renderer
        .create(
          <Provider stepTemplatesStore={stepTemplatesStore}>
            <WorkflowCommonStepDescEditor
              editor={editor}
              stepEditor={stepEditor}
              onCancel={onCancel}
              StepTemplatesStore={stepTemplatesStore}
            />
          </Provider>,
        )
        .toJSON(),
    ).toMatchSnapshot());
});
