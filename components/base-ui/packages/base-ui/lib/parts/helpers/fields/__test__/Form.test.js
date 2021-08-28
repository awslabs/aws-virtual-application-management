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
import Form from '../Form';

describe('Form', () => {
  it('renders correctly', () =>
    expect(
      renderer.create(<Form showErrorPane="true" dimmer="true" form={{ errors: () => ['foo', 'bar'] }} />).toJSON(),
    ).toMatchSnapshot());

  it('has correct properties', () => {
    const onCancel = 'onCancel';
    const onSuccess = 'onSuccess';
    const onError = 'onError';

    const form = new Form({ onCancel, onSuccess, onError });
    expect(form.getOnCancel()).toBe(onCancel);
    expect(form.getOnSuccess()).toBe(onSuccess);
    expect(form.getOnError()).toBe(onError);
  });

  it('handles submit correctly', () => {
    const mockEvent = { preventDefault: jest.fn(), stopPropagation: jest.fn() };
    const form = { errors: () => [], onSubmit: jest.fn() };
    shallow(<Form form={form} />)
      .find('form')
      .simulate('submit', mockEvent);
    expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(mockEvent.stopPropagation).toHaveBeenCalledTimes(1);
    expect(form.onSubmit).toHaveBeenCalledTimes(1);
  });
});
