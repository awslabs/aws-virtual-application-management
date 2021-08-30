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

import toastr from 'toastr';
import { itProp, fc } from 'jest-fast-check';
import { displayError, displayWarning, displaySuccess, displayFormErrors } from '../notification';

jest.mock('toastr');

describe('notification', () => {
  const toasterSuccessOptions = {
    closeButton: true,
    debug: false,
    newestOnTop: true,
    progressBar: true,
    positionClass: 'toast-top-right',
    preventDuplicates: true,
    timeOut: '3000',
    extendedTimeOut: '10000',
  };
  const toasterErrorOptions = {
    closeButton: true,
    debug: false,
    newestOnTop: true,
    progressBar: true,
    positionClass: 'toast-top-right',
    preventDuplicates: true,
    timeOut: '20000',
    extendedTimeOut: '50000',
  };
  const toHtmlString = msg => `${msg} <br/>&nbsp;`;
  const testDisplayFunction = (msg, errorMsg, error, timeOut, level) => {
    const toastrSpy = jest.spyOn(toastr, level);
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const isError = level === 'error';
    const displayFunction = isError ? displayError : displayWarning;
    displayFunction(errorMsg, error, timeOut);
    expect(toastrSpy).toHaveBeenCalledWith(toHtmlString(msg), isError ? 'We have a problem!' : 'Warning!', {
      ...toasterErrorOptions,
      timeOut,
    });
    expect(consoleSpy).toHaveBeenCalledWith(errorMsg, error);
  };

  describe('displayError', () => {
    itProp('displays error string correctly', [fc.lorem(), fc.lorem(), fc.integer()], (msg, error, timeOut) =>
      testDisplayFunction(msg, msg, error, timeOut, 'error'),
    );
    itProp('displays error string correctly', [fc.lorem(), fc.lorem(), fc.integer()], (msg, error, timeOut) =>
      testDisplayFunction(msg, new Error(msg), error, timeOut, 'error'),
    );
  });

  describe('displayWarning', () => {
    itProp('displays warning string correctly', [fc.lorem(), fc.lorem(), fc.integer()], (msg, error, timeOut) =>
      testDisplayFunction(msg, msg, error, timeOut, 'warning'),
    );
    itProp('displays Error object correctly', [fc.lorem(), fc.lorem(), fc.integer()], (msg, error, timeOut) =>
      testDisplayFunction(msg, new Error(msg), error, timeOut, 'warning'),
    );
  });

  describe('displaySuccess', () => {
    itProp('displays success correctly', [fc.lorem(), fc.lorem()], (msg, title) => {
      const toastrSpy = jest.spyOn(toastr, 'success');
      displaySuccess(msg, title);
      expect(toastrSpy).toHaveBeenCalledWith(toHtmlString(msg), title, toasterSuccessOptions);
    });
  });

  describe('displayFormErrors', () => {
    itProp('displays form errors correctly', [fc.lorem()], msg => {
      const toastrSpy = jest.spyOn(toastr, 'error');
      displayFormErrors({
        errors: () => {
          return {
            k: msg,
          };
        },
      });
      expect(toastrSpy).toHaveBeenCalledWith(
        `<br/><ul><li style="margin-left: -20px;">There is an issue with the form:</li><li style="margin-left: -20px;">${msg}</li></ul><br/>&nbsp;`,
        'We have a problem!',
        {
          ...toasterErrorOptions,
          timeOut: 3000,
        },
      );
    });
  });
});
