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

import LoggerService from '../logger-service';

const payload = { pay: 'load' };
const transformedPayload = { transformed: 'payload' };

describe('LoggerService', () => {
  let sut;
  let logTransformer;
  let logger;
  beforeEach(() => {
    // the transformer is covered with its own unit tests
    logTransformer = {
      transformForInfo: jest.fn().mockReturnValue(transformedPayload),
      transformForLog: jest.fn().mockReturnValue(transformedPayload),
      transformForDebug: jest.fn().mockReturnValue(transformedPayload),
      transformForWarn: jest.fn().mockReturnValue(transformedPayload),
      transformForError: jest.fn().mockReturnValue(transformedPayload),
    };
    logger = {
      info: jest.fn(),
      log: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    };
    sut = new LoggerService(logger);
    sut.logTransformer = logTransformer;
  });

  describe.each`
    fn         | transformerFn          | loggerFn
    ${'info'}  | ${'transformForInfo'}  | ${'info'}
    ${'log'}   | ${'transformForLog'}   | ${'log'}
    ${'warn'}  | ${'transformForWarn'}  | ${'warn'}
    ${'debug'} | ${'transformForDebug'} | ${'debug'}
    ${'error'} | ${'transformForError'} | ${'error'}
  `('$fn', ({ fn, transformerFn, loggerFn }) => {
    it('calls the correct functions', () => {
      sut[fn](payload, 'arg0', 'arg1');

      expect(logTransformer[transformerFn]).toHaveBeenCalledWith(payload);
      expect(logger[loggerFn]).toHaveBeenCalledWith(transformedPayload, 'arg0', 'arg1');
    });
  });
});
