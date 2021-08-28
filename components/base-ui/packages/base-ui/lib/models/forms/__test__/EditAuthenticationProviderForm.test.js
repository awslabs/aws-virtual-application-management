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

import MobxReactForm from 'mobx-react-form';
import {
  getEditAuthenticationProviderFormFields,
  getEditAuthenticationProviderForm,
} from '../EditAuthenticationProviderForm';

describe('EditAuthenticationProviderForm', () => {
  describe('getEditAuthenticationProviderFormFields', () => {
    const formFields = {
      title: {
        label: 'Authentication Provider Title',
        extra: {
          explain: 'This is a required field and the number of characters must be between 3 and 255. ',
        },
        placeholder: 'Type a title for the Authentication Provider',
        rules: 'required|between:3,255',
      },
      desc: {
        label: 'Authentication Provider Description',
        placeholder: 'Type a description of the Authentication Provider',
        extra: {
          explain:
            'The Authentication Provider description helps other administrators understand the details about the authentication provider. ' +
            'The description can have a maximum of 2048 characters.',
        },
        rules: 'max:2048',
      },
    };

    it('should return the correct fields', () =>
      expect(getEditAuthenticationProviderFormFields()).toMatchObject(formFields));
  });

  describe('getEditAuthenticationProviderForm', () => {
    it('should return a Form', () => {
      expect(getEditAuthenticationProviderForm()).toBeInstanceOf(MobxReactForm);
    });
  });
});
