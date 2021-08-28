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
import Component from '../Toggle';

describe('Toggle', () => {
  it('renders correctly', () =>
    expect(
      renderer.create(<Component field={{ field: 'field', bind: () => undefined }} />).toJSON(),
    ).toMatchSnapshot());

  it('handles click correctly', () => {
    const mockEvent = { preventDefault: jest.fn(), stopPropagation: jest.fn() };
    const field = {
      sync: jest.fn(),
      validate: jest.fn(),
    };
    const wrapper = shallow(<Component field={field} />);
    wrapper.find('.cursor-pointer').simulate('click', mockEvent);
    expect(mockEvent.preventDefault).toHaveBeenCalledTimes(1);
    expect(mockEvent.stopPropagation).toHaveBeenCalledTimes(1);
    expect(field.sync).toHaveBeenCalledWith(true);
    expect(field.validate).toHaveBeenCalledWith({ showErrors: true });
  });
});
