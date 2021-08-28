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

/* eslint-disable max-classes-per-file */
import translations from '@aws-ee/base-api-i18n/dist/translations/index';
import i18n from 'roddeh-i18n';
import errorHandler from '../error-handler';

class MockResponse {
  constructor() {
    this.headers = {};
  }

  set(key, value) {
    this.headers[key] = value;
    return this;
  }

  status(status) {
    this.lastStatus = status;
    return this;
  }

  json(body) {
    this.body = body;
    return this;
  }
}

class MockRequest {
  constructor(headers = {}) {
    this.i18n = i18n.create({ values: translations.en.values });
    // eslint-disable-next-line no-restricted-syntax
    for (const k of Object.keys(headers)) {
      this[k] = headers[k];
    }
  }
}

describe('ErrorHandler', () => {
  it('calls next when there is no error', () => {
    const nextFn = jest.fn();
    const mockRequest = {};

    errorHandler()(undefined, mockRequest, undefined, nextFn);

    expect(nextFn).toHaveBeenCalledTimes(1);
  });

  it('does not call next when there is an error', () => {
    const nextFn = jest.fn();
    const mockResponse = new MockResponse();
    const mockError = new Error('boom');
    mockError.status = 400;

    errorHandler()(mockError, new MockRequest(), mockResponse, nextFn);

    expect(nextFn).not.toHaveBeenCalled();
  });

  it('sets the status of the response to the error status', () => {
    const mockResponse = new MockResponse();
    const mockError = new Error('boom');
    mockError.status = 400;

    errorHandler()(mockError, new MockRequest(), mockResponse, undefined);

    expect(mockResponse.lastStatus).toBe(400);
  });

  it('constructs the response according to the request fields', () => {
    const mockResponse = new MockResponse();
    const mockError = new Error('boom');
    mockError.status = 400;
    mockError.code = 'mock-code';
    const mockRequest = new MockRequest({
      'x-request-id': 'mock-request-id',
    });

    errorHandler()(mockError, mockRequest, mockResponse, undefined);

    expect(mockResponse.headers).toEqual({ 'X-Request-Id-2': 'mock-request-id' });
    expect(mockResponse.body).toEqual({
      code: 'mock-code',
      message: 'Something went wrong',
      requestId: 'mock-request-id',
    });
  });

  it('does not divulge the error message and payload when it is not safe', () => {
    const sensitiveErrorMessage = 'sensitive error message';
    const mockResponse = new MockResponse();
    const mockError = new Error(sensitiveErrorMessage);
    mockError.status = 400;
    mockError.payload = sensitiveErrorMessage;

    errorHandler()(mockError, new MockRequest(), mockResponse, undefined);

    expect(mockResponse.body.message).not.toEqual(sensitiveErrorMessage);
    expect(mockResponse.body.payload).not.toEqual(sensitiveErrorMessage);
  });

  it('passes the error message when it is safe', () => {
    const safeErrorMessage = 'safe error message';
    const mockResponse = new MockResponse();
    const mockError = new Error(safeErrorMessage);
    mockError.status = 400;
    mockError.safe = true;
    mockError.payload = safeErrorMessage;

    errorHandler()(mockError, new MockRequest(), mockResponse, undefined);

    expect(mockResponse.body.message).toEqual(safeErrorMessage);
    expect(mockResponse.body.payload).toEqual(safeErrorMessage);
  });
});
