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
import WorkflowCommonStepConfigEditor from '../WorkflowCommonStepConfigEditor';

describe('WorkflowCommonStepConfigEditor', () => {
  //   const mockEvent = { preventDefault: jest.fn(), stopPropagation: jest.fn() };
  // eslint-disable-next-line no-unused-vars
  let component = null;
  let wrapper = null;
  const form = { errors: () => [] };
  const cancel = jest.fn();
  const previous = jest.fn();
  const onSave = jest.fn();
  const applyChanges = jest.fn();
  const restart = jest.fn();
  const entries = () => {
    return [['key', 'value']];
  };
  const stepEditor = {
    step: jest.fn(),
    configEdit: jest.fn(),
    setConfigEdit: jest.fn(),
    configurationEditor: {
      form,
      applyChanges,
      restart,
      previous,
      cancel,
      definedConfigList: [],
      configuration: { entries },
      review: 'review',
    },
  };
  const className = 'test-className';
  const onCancel = jest.fn();
  const stepTemplatesStore = { load: jest.fn() };
  beforeEach(() => {
    // Render component
    wrapper = shallow(
      <WorkflowCommonStepConfigEditor
        stepEditor={stepEditor}
        onSave={onSave}
        className={className}
        onCancel={onCancel}
      />,
    );

    // Get instance of the component
    component = wrapper.instance();
  });
  it('renders correctly', () =>
    expect(
      renderer
        .create(
          <Provider stepTemplatesStore={stepTemplatesStore}>
            <WorkflowCommonStepConfigEditor stepEditor={stepEditor} onSave={onSave} className={className} />
          </Provider>,
        )
        .toJSON(),
    ).toMatchSnapshot());
});
