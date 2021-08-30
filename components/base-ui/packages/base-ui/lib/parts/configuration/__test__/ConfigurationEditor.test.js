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
import ConfigurationEditor from '../ConfigurationEditor';

describe('ConfigurationEditor', () => {
  it('renders correctly', () =>
    expect(
      renderer.create(<ConfigurationEditor model={{ form: { errors: () => undefined } }} />).toJSON(),
    ).toMatchSnapshot());

  describe('handles click events correctly', () => {
    const mockEvent = { preventDefault: jest.fn(), stopPropagation: jest.fn() };
    const form = { errors: () => [] };
    const onCancel = jest.fn();
    const cancel = jest.fn();
    const next = jest.fn();
    const entries = () => {
      return [['key', 'value']];
    };
    const configurationEditor = shallow(
      <ConfigurationEditor
        onCancel={onCancel}
        model={{
          form,
          hasPrevious: true,
          totalSections: 5,
          currentSectionIndex: 0,
          inputManifestSection: {
            children: [1, 2, 3, 4],
          },
          next,
          cancel,
          definedConfigList: [],
          configuration: { entries },
          review: 'review',
        }}
      />,
    );

    it('handles cancel correctly', async () => {
      configurationEditor.find('Form').simulate('cancel', mockEvent);
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('handles success correctly', async () => {
      configurationEditor.find('Form').simulate('success', mockEvent);
      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
