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

import _ from 'lodash';
import jwt from 'jsonwebtoken';
import ServicesContainerMock from '../../__mocks__/services-container.mock';
import SettingsServiceMock from '../../__mocks__/settings-service.mock';
import JwtService from '../jwt-service';

const testJWTSecret = 'TestSecret';
const payload = {
  test: 'value',
};

class SSM {
  getParameter() {
    return {
      promise: async () => {
        return {
          Parameter: {
            Value: testJWTSecret,
          },
        };
      },
    };
  }
}

const settings = {
  paramStoreJwtSecret: testJWTSecret,
  jwtOptions: {},
};

describe('JwtService', () => {
  let sut;
  let container;

  beforeEach(async done => {
    sut = new JwtService();
    container = new ServicesContainerMock({
      sut,
      aws: { sdk: { SSM } },
      settings: new SettingsServiceMock(settings),
      log: { info: jest.fn() },
    });
    await container.initServices();
    done();
  });

  describe('.getSecret', () => {
    it('returns the correct secret', async done => {
      const secret = await sut.getSecret();
      expect(secret).toBe(testJWTSecret);
      done();
    });
  });

  describe('.sign', () => {
    it('encodes a payload', async done => {
      const encodedToken = await sut.sign(payload);
      const decoded = jwt.decode(encodedToken);
      expect(_.omit(decoded, 'iat')).toEqual(payload);
      done();
    });

    it('signs a payload', async done => {
      const encodedToken = await sut.sign(payload);
      const verified = jwt.verify(encodedToken, testJWTSecret);
      expect(_.omit(verified, 'iat')).toEqual(payload);
      done();
    });
  });

  describe('verify', () => {
    let token;
    beforeEach(async done => {
      token = await sut.sign(payload);
      done();
    });

    it('verifies a correct token', async done => {
      const verified = await sut.verify(token);
      expect(_.omit(verified, 'iat')).toEqual(payload);
      done();
    });

    it('throws on an invalid token', async done => {
      try {
        await sut.verify('invalid');
      } catch (err) {
        expect(err.message).toEqual('Invalid Token');
        expect(err.status).toEqual(403);
        expect(err.safe).toEqual(true);
        done();
        return;
      }
      throw new Error('Expected an exception');
    });
  });

  describe('decode', () => {
    let token;
    beforeEach(async done => {
      token = await sut.sign(payload);
      done();
    });

    it('decodes a correct token', async done => {
      const decoded = await sut.decode(token);
      expect(decoded.header).toEqual({ alg: 'HS256', typ: 'JWT' });
      expect(_.omit(decoded.payload, 'iat')).toEqual(payload);
      expect(decoded.signature).toBeTruthy();
      done();
    });

    it('decodes a correct token, noncomplete mode', async done => {
      const decoded = await sut.decode(token, { complete: false });
      expect(_.omit(decoded, 'iat')).toEqual(payload);
      done();
    });

    it('throws on an invalid token', async done => {
      try {
        await sut.decode('invalid');
      } catch (err) {
        expect(err.message).toEqual('Invalid Token');
        expect(err.status).toEqual(403);
        expect(err.safe).toEqual(true);
        done();
        return;
      }
      throw new Error('Expected an exception');
    });
  });
});
