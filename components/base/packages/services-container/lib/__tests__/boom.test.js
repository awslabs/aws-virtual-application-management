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

import { itProp, fc } from 'jest-fast-check';
import Boom from '../boom';

describe('Boom', () => {
  it('constructs with the expected defaults', () => {
    const boom = new Boom();
    expect(Object.keys(boom)).toEqual([
      'badRequest',
      'concurrentUpdate',
      'unauthorized',
      'forbidden',
      'invalidToken',
      'notFound',
      'alreadyExists',
      'outdatedUpdateAttempt',
      'timeout',
      'badImplementation',
      'internalError',
    ]);
  });

  describe.each`
    method                     | status
    ${'badRequest'}            | ${400}
    ${'concurrentUpdate'}      | ${400}
    ${'unauthorized'}          | ${401}
    ${'forbidden'}             | ${403}
    ${'invalidToken'}          | ${403}
    ${'notFound'}              | ${404}
    ${'alreadyExists'}         | ${400}
    ${'outdatedUpdateAttempt'} | ${409}
    ${'timeout'}               | ${408}
    ${'badImplementation'}     | ${500}
    ${'internalError'}         | ${500}
  `('$method', ({ method, status }) => {
    it('creates errors with the expected code and status', () => {
      const boom = new Boom();
      const boomError = boom[method]();

      expect(boomError.code).toBe(method);
      expect(boomError.status).toBe(status);
    });

    itProp('passes a message and safe flag', [fc.string(), fc.boolean()], (msg, safe) => {
      const boom = new Boom();
      const boomError = boom[method](msg, safe);
      expect(boomError.message).toBe(msg);
      expect(boomError.safe).toBe(safe);
    });
  });

  describe('.extend', () => {
    itProp('throws on non-array definitions', [fc.oneof(fc.object(), fc.string(), fc.nat())], def => {
      const boom = new Boom();

      expect(() => boom.extend(def)).toThrow(
        `You tried to extend boom, but one of the elements you provided is not an array "${def}". You need to pass an array of arrays.`,
      );
    });

    itProp(
      'adds a function that creates a correctly shaped error',
      [fc.string(), fc.nat(), fc.string(), fc.boolean()],
      (name, status, message, safe) => {
        const boom = new Boom();
        boom.extend([name, status]);

        const boomError = boom[name](message, safe);

        expect(boomError.safe).toBe(safe);
        expect(boomError.message).toBe(message);
        expect(boomError.code).toBe(name);
        expect(boomError.status).toBe(status);
      },
    );
  });

  describe('.is', () => {
    itProp('is always false when the passed error is empty', [fc.anything(), fc.string()], (error, code) => {
      fc.pre(!error);
      const boom = new Boom();
      expect(boom.is(error, code)).toBeFalsy();
    });

    itProp('is always false when the passed error is not a boom', [fc.string()], code => {
      const boom = new Boom();
      expect(boom.is({ code }, code)).toBeFalsy();
    });

    itProp('is always true when the passed error has the same code', [fc.string()], code => {
      const boom = new Boom();
      expect(boom.is({ boom: true, code }, code)).toBeTruthy();
    });

    itProp(
      'is false when the passed error is a boom with a different code',
      [fc.string(), fc.string()],
      (codeA, codeB) => {
        fc.pre(codeA !== codeB);

        const boom = new Boom();

        expect(boom.is({ boom: true, code: codeA }, codeB)).toBeFalsy();
      },
    );
  });

  describe('.code', () => {
    itProp('returns empty when undefined is passed', [fc.anything()], error => {
      fc.pre(!error);
      const boom = new Boom();
      expect(boom.code(error)).toBe('');
    });

    itProp('returns empty when the code property is missing', [fc.object()], error => {
      fc.pre(!error.code);
      const boom = new Boom();
      expect(boom.code(error)).toBe('');
    });

    itProp('returns the code property', [fc.string()], code => {
      const boom = new Boom();
      expect(boom.code({ code })).toBe(code);
    });
  });
});
