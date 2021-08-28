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
import ConfigurationReview from '../ConfigurationReview';

describe('ConfigurationEditor', () => {
  it('renders correctly', () =>
    expect(
      renderer.create(<ConfigurationReview model={{ form: { errors: () => undefined } }} />).toJSON(),
    ).toMatchSnapshot());

  describe('handles click events correctly', () => {
    const mockEvent = { preventDefault: jest.fn(), stopPropagation: jest.fn() };
    const form = { errors: () => [] };
    const cancel = jest.fn();
    const previous = jest.fn();
    const onSave = jest.fn();
    const applyChanges = jest.fn();
    const restart = jest.fn();
    const entries = () => {
      return [['key', 'value']];
    };
    const configurationReview = shallow(
      <ConfigurationReview
        onSave={onSave}
        model={{
          form,
          applyChanges,
          restart,
          previous,
          cancel,
          definedConfigList: [],
          configuration: { entries },
          review: 'review',
        }}
      />,
    );

    it('handles save correctly', async () => {
      await configurationReview
        .find('Button')
        .first()
        .simulate('click', mockEvent);
      expect(onSave).toHaveBeenCalledTimes(1);
      expect(applyChanges).toHaveBeenCalledTimes(1);
      expect(restart).toHaveBeenCalledTimes(1);
    });

    it('handles previous correctly', () => {
      configurationReview
        .find('Button')
        .at(1)
        .simulate('click', mockEvent);
      expect(previous).toHaveBeenCalledTimes(1);
    });

    it('handles cancel correctly', () => {
      configurationReview
        .find('Button')
        .last()
        .simulate('click', mockEvent);
      expect(cancel).toHaveBeenCalledTimes(1);
    });
  });
});
