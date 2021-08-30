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
import _ from 'lodash/fp';
import LogTransformer from '../log-transformer';

describe('LogTransformer', () => {
  let sut;
  beforeEach(() => {
    sut = new LogTransformer();
  });

  describe.each`
    input                       | output
    ${{}}                       | ${{}}
    ${{ field: 'testContent' }} | ${{ field: 'testContent' }}
    ${{ password: 'secret' }}   | ${{ password: '****' }}
    ${new Error('testError')}   | ${{ msg: 'testError', stack: expect.any(String) }}
    ${['itemA', 'itemB']}       | ${{ msg: ['itemA', 'itemB'] }}
    ${42}                       | ${{ msg: 42 }}
  `('with $input', ({ input, output }) => {
    it('transforms as expected for info', () => {
      expect(JSON.parse(sut.transformForInfo(input))).toEqual({ ...output, logLevel: 'info' });
    });

    it('transforms as expected for log', () => {
      expect(JSON.parse(sut.transformForLog(input))).toEqual({ ...output, logLevel: 'log' });
    });

    it('transforms as expected for debug', () => {
      expect(JSON.parse(sut.transformForDebug(input))).toEqual({ ...output, logLevel: 'debug' });
    });

    it('transforms as expected for warn', () => {
      expect(JSON.parse(sut.transformForWarn(input))).toEqual({ ...output, logLevel: 'warn' });
    });

    it('transforms as expected for error', () => {
      expect(JSON.parse(sut.transformForError(input))).toEqual({ ...output, logLevel: 'error' });
    });
  });

  describe('constructor', () => {
    it('returns LogTransformer comprising defaults', () => {
      const logTransformer = new LogTransformer();
      expect(logTransformer.loggingContext).toMatchObject({});
      expect(logTransformer.fieldsToMask).toEqual(['x-amz-security-token', 'user', 'accessKey', 'password']);
    });
    itProp(
      'returns LogTransformer comprising specified parameters',
      [fc.anything(), fc.anything()],
      (loggingContext, fieldsToMask) => {
        const logTransformer = new LogTransformer(loggingContext, fieldsToMask);
        expect(logTransformer).toMatchObject({
          loggingContext: loggingContext || {},
          fieldsToMask: _.isUndefined(fieldsToMask)
            ? ['x-amz-security-token', 'user', 'accessKey', 'password']
            : fieldsToMask,
        });
      },
    );
  });

  describe('transform', () => {
    const toTransform = level => `transformFor${_.startCase(level)}`;
    itProp(
      'returns parameter transformed for each level with specified fields masked',
      [fc.dictionary(fc.lorem(), fc.lorem()), fc.lorem()],
      (logPayload, fieldToMask) => {
        const assertExpected = level => {
          const expected = _.merge({ logLevel: level }, logPayload);
          expected[fieldToMask] = '****';
          const result = new LogTransformer({}, [fieldToMask])[toTransform(level)](logPayload);
          expect(result).toMatch(JSON.stringify(expected));
        };
        logPayload = _.set(fieldToMask)(fieldToMask)(logPayload);
        ['info', 'log', 'debug', 'warn', 'error'].forEach(assertExpected);
      },
    );

    itProp(
      'returns logging context transformed for info without specified fields masked',
      [fc.dictionary(fc.lorem(), fc.lorem()), fc.lorem()],
      (loggingContext, fieldToMask) => {
        const assertExpected = level => {
          const expected = _.merge(loggingContext, { logLevel: level });
          const result = new LogTransformer(loggingContext, [fieldToMask])[toTransform(level)]({});
          expect(result).toMatch(JSON.stringify(expected));
        };
        loggingContext = _.set(fieldToMask)(fieldToMask)(loggingContext);
        ['info', 'log', 'debug', 'warn', 'error'].forEach(assertExpected);
      },
    );
  });
});
