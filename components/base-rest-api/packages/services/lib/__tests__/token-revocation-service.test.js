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

import ServicesContainerMock from '../../__mocks__/services-container.mock';
import DbServiceMock from '../../__mocks__/db-service.mock';
import SettingsServiceMock from '../../__mocks__/settings-service.mock';
import TokenRevocationService from '../token-revocation-service';

const settings = {
  dbRevokedTokens: 'dbRevokedTokens',
};

const signature = '_YGCKnYZM1VyZqRiok_fs3fRan1WTMBYPZZ5BsF9e4w';
const validToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZXN0IjoidmFsdWUiLCJpYXQiOjE2MDYyMTQ1OTR9.${signature}`;

describe('TokenRevocationService', () => {
  let sut;
  let container;
  let db;

  beforeEach(async done => {
    sut = new TokenRevocationService();
    db = new DbServiceMock();
    container = new ServicesContainerMock({
      sut,
      dbService: db,
      settings: new SettingsServiceMock(settings),
      log: {},
    });
    await container.initServices();
    done();
  });

  describe('.revoke', () => {
    it('creates a revoke record for a valid token', async done => {
      await sut.revoke(undefined, { token: validToken });
      expect(db.getItem(settings.dbRevokedTokens, { id: signature })).toEqual({
        id: signature,
        ttl: 0,
      });
      done();
    });

    it('fails for an invalid token', async done => {
      try {
        await sut.revoke(undefined, { token: 'invalidToken' });
      } catch (err) {
        expect(err.message).toBe('Invalid Token');
        expect(err.status).toBe(403);
        expect(err.safe).toBe(true);
        done();
        return;
      }
      throw new Error('Expected an exception');
    });
  });

  describe('.isRevoked', () => {
    it('fails for an invalid token', async done => {
      try {
        await sut.isRevoked({ token: 'invalidToken' });
      } catch (err) {
        expect(err.message).toBe('Invalid Token');
        expect(err.status).toBe(403);
        expect(err.safe).toBe(true);
        done();
        return;
      }
      throw new Error('Expected an exception');
    });

    describe('when a valid token is not revoked', () => {
      it('returns false', async done => {
        const result = await sut.isRevoked({ token: validToken });
        expect(result).toBe(false);
        done();
      });
    });

    describe('when a valid token has been revoked', () => {
      beforeEach(async done => {
        await sut.revoke(undefined, { token: validToken });
        done();
      });
      it('returns true', async done => {
        const result = await sut.isRevoked({ token: validToken });
        expect(result).toBe(true);
        done();
      });
    });
  });
});
