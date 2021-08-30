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
import EditableField from '../EditableField';

describe('EditableField', () => {
  const onCancel = jest.fn();
  const renderFieldForView = jest.fn();
  const renderFieldForEdit = jest.fn();
  const onSubmit = jest.fn();
  const editableField = (
    <EditableField
      editorOn="true"
      onCancel={onCancel}
      onSubmit={onSubmit}
      renderFieldForEdit={renderFieldForEdit}
      renderFieldForView={renderFieldForView}
      inputEntries={[
        {
          name: 'name',
          type: 'stringInput',
        },
      ]}
      form={{
        $: () => {
          return { bind: () => [1, 2, 3] };
        },
        errors: () => undefined,
      }}
      model={{ form: { errors: () => undefined } }}
    />
  );
  it('renders correctly', () => expect(renderer.create(editableField).toJSON()).toMatchSnapshot());

  it('handles cancel correctly', async () => {
    const mockEvent = { preventDefault: jest.fn(), stopPropagation: jest.fn() };
    shallow(editableField)
      .find('Form')
      .simulate('cancel', mockEvent);
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(renderFieldForView).toHaveBeenCalledTimes(1);
  });
});
