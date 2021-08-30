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
import EditableNameValueRow from '../EditableNameValueRow';

describe('EditableNameValueRow', () => {
  it('renders correctly', () => expect(renderer.create(<EditableNameValueRow />).toJSON()).toMatchSnapshot());

  it('handles submit correctly', async () => {
    const mockEvent = { preventDefault: jest.fn(), stopPropagation: jest.fn() };
    const form = { errors: () => [] };
    const onExitEditMode = jest.fn();
    await shallow(<EditableNameValueRow form={form} onExitEditMode={onExitEditMode} />)
      .find('EditableField')
      .simulate('submit', mockEvent);
    expect(onExitEditMode).toHaveBeenCalledTimes(1);
  });
});
