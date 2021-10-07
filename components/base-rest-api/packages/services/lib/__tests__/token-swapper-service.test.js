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
import TokenSwapperService from '../token-swapper-service';

const settingsKey = {
  dbValidTokens: 'dbValidTokens',
  dbRevokedTokens: 'dbRevokedTokens',
};

const tokenRevokerLocator = 'locator:service:revokeServiceMock/revoke';

const signature = 'Qp986ORGvg5FBsOMbtR-Gv4xTnHGskr-u0a1M148ysY';
const validToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZXN0IjoidmFsdWUiLCJpYXQiOjE2MDYyMTQ1OTQsImV4cCI6MX0.${signature}`;

const secondSignature = 'v_F59TPyiBTdhxeqVG5A0UioGJpkdwyEBoJdLS3G5eQ';
const secondValidToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZXN0IjoidmFsdWUiLCJpYXQiOjE2MDYyMTQ1OTQsImV4cCI6Mn0.${secondSignature}`;

const expiredSignature = 'acXIsOvdd3RxCeANdmxyd1gfnVl9qaOg1ZIrC3S9NbI';
const expiredToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZXN0IjoidmFsdWUiLCJpYXQiOjE2MDYyMTQ1OTQsImV4cCI6MH0.${expiredSignature}`;

const validUID = '1234567890';

describe('TokenSwapperService', () => {
  let sut;
  let container;
  let dbService;
  let authenticationProviderConfigService;
  let logger;
  let settings;
  let revokeServiceMock;

  beforeEach(async done => {
    sut = new TokenSwapperService();
    dbService = new DbServiceMock();
    authenticationProviderConfigService = { getAuthenticationProviderConfig: jest.fn() };
    logger = { info: jest.fn() };
    settings = new SettingsServiceMock(settingsKey);
    revokeServiceMock = { revoke: jest.fn() };
    container = new ServicesContainerMock({
      sut,
      dbService,
      settings,
      authenticationProviderConfigService,
      revokeServiceMock,
      log: logger,
    });
    await container.initServices();
    done();
  });

  describe('.swap', () => {
    it('fails with empty token', async done => {
      try {
        await sut.swap({ token: '', uid: '1' });
      } catch (err) {
        expect(err.message).toBe('Invalid Token');
        expect(err.status).toBe(403);
        expect(err.safe).toBe(true);
        done();
        return;
      }
      throw new Error('Expected an exception');
    });

    it('fails with invalid token', async done => {
      try {
        await sut.swap({ token: 'Invalid Token', uid: '1' });
      } catch (err) {
        expect(err.message).toBe('Invalid Token');
        expect(err.status).toBe(403);
        expect(err.safe).toBe(true);
        done();
        return;
      }
      throw new Error('Expected an exception');
    });

    it('fails with empty uid', async done => {
      try {
        await sut.swap({ token: validToken, uid: '' });
      } catch (err) {
        expect(err.message).toBe('Empty uid');
        expect(err.status).toBe(400);
        expect(err.safe).toBe(true);
        done();
        return;
      }
      throw new Error('Expected an exception');
    });

    describe('Same token being swapped', () => {
      beforeEach(async done => {
        await sut.swap({ token: validToken, uid: validUID });
        done();
      });

      it('passes when same token is swapped', async done => {
        try {
          await sut.swap({ token: validToken, uid: validUID });
        } catch (err) {
          throw new Error(`Expected no error but error shown: ${err}`);
        }
        expect(dbService.getItem(settingsKey.dbRevokedTokens, { uid: validUID })).toBeUndefined();
        expect(dbService.getItem(settingsKey.dbValidTokens, { uid: validUID })).toEqual({
          token: validToken,
          ttl: 1,
          uid: validUID,
        });

        done();
      });
    });
    it('fails with expired token', async done => {
      try {
        await sut.swap({ token: expiredToken, uid: validUID });
      } catch (err) {
        expect(err.message).toBe('Expired Token');
        expect(err.status).toBe(403);
        expect(err.safe).toBe(true);
        done();
        return;
      }
      throw new Error('Expected an exception');
    });
    it('passes with valid token and valid uid', async done => {
      try {
        await sut.swap({ token: validToken, uid: validUID });
      } catch (err) {
        throw new Error(`Expected no exception but error shown: ${err}`);
      }
      done();
    });
    describe('when valid provider config is given', () => {
      beforeEach(async done => {
        authenticationProviderConfigService.getAuthenticationProviderConfig.mockReturnValue({
          config: {
            type: {
              config: { impl: { tokenRevokerLocator } },
            },
          },
        });
        await sut.swap({ token: validToken, uid: validUID });
        done();
      });
      it('passes with swapping existing token and new token', async done => {
        try {
          await sut.swap({ token: secondValidToken, uid: validUID });
        } catch (err) {
          throw new Error(`Expected no exception but error shown: ${err}`);
        }
        done();
      });
    });
    describe('when no provider config is given', () => {
      beforeEach(async done => {
        await sut.swap({ token: validToken, uid: validUID });
        done();
      });
      it('passes with swapping existing token and new token', async done => {
        try {
          await sut.swap({ token: secondValidToken, uid: validUID });
        } catch (err) {
          expect(err.message).toBe(
            "Error revoking token. The authentication provider with id = 'undefined' does not support token revocation",
          );
          expect(err.status).toBe(400);
          expect(err.safe).toBe(false);
          done();
          return;
        }
        throw new Error('Expected an exception');
      });
    });

    describe('when invalid token is in db', () => {
      beforeEach(async done => {
        const dbValidTokens = settings.get(settingsKey.dbValidTokens);
        const record = { token: 'Invalid Token' };
        await dbService.helper
          .updater()
          .table(dbValidTokens)
          .key({ uid: validUID })
          .item(record)
          .update();
        done();
      });
      it('fails with invalid token in db', async done => {
        try {
          await sut.swap({ token: validToken, uid: validUID });
        } catch (err) {
          expect(err.message).toBe('Invalid Revoke Token');
          expect(err.status).toBe(403);
          expect(err.safe).toBe(true);
          done();
          return;
        }
        throw new Error('Expected an exception');
      });
    });

    describe('when revoker throws an error', () => {
      beforeEach(async done => {
        authenticationProviderConfigService.getAuthenticationProviderConfig.mockReturnValue({
          config: {
            type: {
              config: { impl: { tokenRevokerLocator } },
            },
          },
        });
        await sut.swap({ token: validToken, uid: validUID });
        revokeServiceMock.revoke.mockImplementation(() => {
          throw new Error('Revoker error');
        });
        done();
      });
      it('fails when revoker throws an error', async done => {
        try {
          await sut.swap({ token: secondValidToken, uid: validUID });
        } catch (err) {
          expect(err.message).toBe('Error trying to revoke token');
          expect(err.status).toBe(400);
          expect(err.safe).toBe(false);
          done();
          return;
        }
        throw new Error('Expected an exception');
      });
    });
  });
});
