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

import i18n from 'roddeh-i18n';
import i18nHandler from '../i18n-handler';

const createMockRequest = acceptLang => {
  return {
    acceptsLanguages: () => {
      return acceptLang;
    },
  };
};

describe('i18nHandler', () => {
  it('uses the preferred supported language when it is available', () => {
    const mockTranslators = {
      en: 'en',
      ja: 'ja',
    };
    const middleware = i18nHandler(mockTranslators, { 'en-GB': 'en', 'ja': 'ja' }, 'en');
    const mockRequest = createMockRequest('en-GB');
    middleware(mockRequest, undefined, jest.fn());
    expect(mockRequest.i18n).toBe('en');
  });

  it('uses the default language when no supported languages are available', () => {
    const mockTranslators = {
      en: 'en',
      ja: 'ja',
    };
    const middleware = i18nHandler(mockTranslators, undefined, 'ja');
    const mockRequest = createMockRequest('en-GB');
    middleware(mockRequest, undefined, jest.fn());
    expect(mockRequest.i18n).toBe('ja');
  });

  it('uses English (en) when there are no supported languages and no default language', () => {
    const mockTranslators = {
      en: 'en',
      ja: 'ja',
    };
    const middleware = i18nHandler(mockTranslators, undefined, undefined);
    const mockRequest = createMockRequest('en-GB');
    middleware(mockRequest, undefined, jest.fn());
    expect(mockRequest.i18n).toBe('en');
  });

  it("attaches the singleton i18n instance as a default when the expected language doesn't exist within the translators", () => {
    const mockTranslators = {
      en: 'en',
      ja: 'ja',
    };
    const middleware = i18nHandler(mockTranslators, undefined, 'zh');
    const mockRequest = createMockRequest('zh');
    middleware(mockRequest, undefined, jest.fn());
    expect(mockRequest.i18n).toBe(i18n);
  });
});
