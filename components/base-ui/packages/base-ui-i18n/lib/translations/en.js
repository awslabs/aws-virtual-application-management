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

import keys from '../keys';

const en = {
  values: {
    // Splash
    [keys.LOADING_TITLE]: 'Just one second',
    [keys.LOADING_SUBTITLE]: 'Great things are now happening, please wait!',
    [keys.DEFAULT_ERROR_MESSAGE]: 'See if refreshing the browser will resolve your issue.',
    [keys.APP_ERROR_MESSAGE]:
      'Something went wrong and the error message is %{errorDetail}.  Please refresh your browser.',
    // Login UI
    [keys.LOGIN]: 'Login',
    [keys.LOGOUT]: 'Logout',
    [keys.USERNAME]: 'Username',
    [keys.PASSWORD]: 'Password',
    [keys.USERNAME_REQUIRED]: 'username is required',
    [keys.USERNAME_MIN_LENGTH]: 'username must be at least 3 characters long',
    [keys.PASSWORD_REQUIRED]: 'password is required',
    [keys.PASSWORD_MIN_LENGTH]: 'password must be at least 4 characters long',
    // Errors and Notifications
    [keys.WE_HAVE_A_PROBLEM]: 'We have a problem!',
    [keys.WARNING]: 'Warning!',
    [keys.SUBMITTED]: 'Submitted!',
    [keys.FORM_SUBMISSION_PROBLEM]: 'The form submission has a problem.',
    [keys.ISSUES_WITH_FORM]: [
      [0, 0, 'There are issues with the form:'],
      [1, 1, 'There is an issues with the form:'],
      [2, null, 'There are issues with the form:'],
    ],
    [keys.UNKNOWN_ERROR]: 'Unknown error',
    // Main layout menu items
    [keys.MENU_DASHBOARD]: 'Dashboard',
    [keys.MENU_AUTH]: 'Auth',
    [keys.MENU_USERS]: 'Users',
    [keys.MENU_API_KEYS]: 'API Keys',
    [keys.MENU_VERSION]: 'Version',
    // General
    [keys.CONFIRM]: 'Confirm',
    [keys.CANCEL]: 'Cancel',
    [keys.DONE]: 'Done',
  },
};

export default en;
