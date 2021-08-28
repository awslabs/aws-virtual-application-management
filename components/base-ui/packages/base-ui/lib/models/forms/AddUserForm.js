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

import dvr from 'mobx-react-form/lib/validators/DVR';
import Validator from 'validatorjs';
import MobxReactForm from 'mobx-react-form';

const addUserFormFields = {
  username: {
    label: 'User Name',
    placeholder: 'Type a unique username for the user',
    explain: `The username must be between 3 and 300 characters long. Once the user is created, you can not change the username and can not delete the user. You will be able to de-activate/activate the user.`,
    rules: 'required|string|between:3,300',
  },
  email: {
    label: 'Email',
    placeholder: 'Type email address for the user',
    rules: 'required|email|string',
  },
  firstName: {
    label: 'First Name',
    placeholder: 'Type first name of the user',
    rules: 'required|string|between:1,500',
  },
  lastName: {
    label: 'Last Name',
    placeholder: 'Type last name of the user',
    rules: 'required|string|between:4,500',
  },
  userRole: {
    label: 'UserRole',
    extra: { explain: "Select user's role" },
    rules: 'required',
  },
  identityProviderName: {
    label: 'Identity Provider',
    extra: { explain: 'Identity Provider for this user' },
  },
  status: {
    label: 'Status',
    extra: { explain: 'Select if the user should be active user' },
  },
};

function getAddUserFormFields() {
  return addUserFormFields;
}

function getAddUserForm() {
  const plugins = { dvr: dvr(Validator) }; // , vjf: validator };
  return new MobxReactForm({ fields: addUserFormFields }, { plugins });
}

export { getAddUserFormFields, getAddUserForm };
