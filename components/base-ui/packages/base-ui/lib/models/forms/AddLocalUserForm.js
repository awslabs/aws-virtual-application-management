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

/* eslint-disable import/prefer-default-export */
import { createForm } from '../../helpers/form';

const addUserFormFields = {
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
    rules: 'required|string|between:1,500',
  },
  userRole: {
    label: 'UserRole',
    extra: { explain: "Select user's role" },
    rules: 'required',
  },
  status: {
    label: 'Status',
    extra: {
      explain: 'Active users can log into the solution portal',
      yesLabel: 'Active',
      noLabel: 'Inactive',
      yesValue: 'active',
      noValue: 'inactive',
    },
    rules: 'required',
  },
};

function getAddUserForm() {
  return createForm(addUserFormFields);
}

export { getAddUserForm };
