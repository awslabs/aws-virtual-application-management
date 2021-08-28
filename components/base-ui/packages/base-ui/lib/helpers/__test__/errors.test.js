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

import * as fc from 'fast-check';
import _ from 'lodash/fp';
import { boom, isForbidden, isNotFound, isTokenExpired } from '../errors';

describe('errors', () => {
  const fcErrors = fc.constantFrom(Error, EvalError, RangeError, ReferenceError, SyntaxError, TypeError, URIError);

  describe('isForbidden, isNotFound, isTokenExpired', () => {
    const toError = code => {
      return {
        code,
      };
    };
    const composeToError = f => _.compose(f, toError);
    const isForbiddenError = composeToError(isForbidden);
    const isNotFoundError = composeToError(isNotFound);
    const isTokenExpiredError = composeToError(isTokenExpired);

    it('returns true where code matches expected values', () => {
      expect(isForbiddenError('forbidden')).toBe(true);
      expect(isNotFoundError('notFound')).toBe(true);
      expect(isTokenExpiredError('tokenExpired')).toBe(true);
    });
    it('returns false where code does not match expected values', () => {
      fc.assert(
        fc.property(
          fc.string().filter(a => !_.contains(a)(['forbidden', 'notFound', 'tokenExpired'])),
          a => {
            expect(isForbiddenError(a)).toBe(false);
            expect(isNotFoundError(a)).toBe(false);
            expect(isTokenExpiredError(a)).toBe(false);
          },
        ),
      );
    });
  });

  describe('boom', () => {
    const isError = (object, code, friendly) =>
      object instanceof Error && object.code === code && object.isBoom && object.friendly === friendly;
    it('returns Error when first parameter is string', () => {
      fc.assert(fc.property(fc.string(), fc.string(), (a, b) => expect(isError(boom.error(a, b), b, a)).toBe(true)));
    });
    it('returns Error when first parameter is error or object', () => {
      fc.assert(
        fc.property(fc.oneof(fcErrors, fc.object()), fc.string(), fc.string(), (a, b) =>
          expect(isError(boom.error(a, b), b, _.startCase(b))).toBe(true),
        ),
      );
    });
  });
});
