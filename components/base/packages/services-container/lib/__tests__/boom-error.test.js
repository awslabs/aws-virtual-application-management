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
import BoomError from '../boom-error';

describe('BoomError', () => {
  it('uses the expected defaults', () => {
    const boom = new BoomError();
    expect({ ...boom }).toEqual({
      boom: true,
      code: 'badImplementation',
      safe: false,
      status: 500,
    });
  });

  itProp('sets the message of the error (string version)', [fc.string({ minLength: 1 })], msg => {
    const boom = new BoomError(msg);
    expect(boom.message).toBe(msg);
  });

  itProp('sets the message of the error (object version)', [fc.string({ minLength: 1 })], msg => {
    const boom = new BoomError(new Error(msg));
    expect(boom.message).toBe(msg);
  });

  itProp('sets the safe flag', [fc.boolean()], safe => {
    const boom = new BoomError(undefined, safe);
    expect(boom.safe).toBe(safe);
  });

  itProp('sets the code', [fc.string()], code => {
    const boom = new BoomError(undefined, undefined, code);
    expect(boom.code).toBe(code);
  });

  itProp('sets the status', [fc.nat()], status => {
    const boom = new BoomError(undefined, undefined, undefined, status);
    expect(boom.status).toBe(status);
  });

  it('sets the root error', () => {
    const rootError = new Error();

    const boom = new BoomError(rootError);

    expect(boom.root).toBe(rootError);
  });

  describe('.withPayload', () => {
    itProp('sets the payload object', [fc.object()], payload => {
      const boom = new BoomError();
      expect(boom.payload).toBeUndefined();

      const returnedBoom = boom.withPayload(payload);

      expect(returnedBoom).toBe(boom);
      expect(returnedBoom.payload).toBe(payload);
    });
  });

  describe('.cause', () => {
    itProp('sets the root error', [fc.object()], root => {
      const boom = new BoomError();
      expect(boom.root).toBeUndefined();

      const returnedBoom = boom.cause(root);

      expect(returnedBoom).toBe(boom);
      expect(returnedBoom.root).toBe(root);
    });
  });
});
