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
import ServicesContainerMock from '../__mocks__/services-container.mock';
import ProviderService from '../provider-service';

jest.mock('../helpers/cognito-token-verifier');

const mockTokenPayload = {
  username: 'test user',
  uid: 'test user',
  identityProviderName: 'testprovider',
};
const mockToken = jwt.sign(mockTokenPayload, 'mockSecret');

class UserServiceMock {
  constructor() {
    this.users = {};
  }

  async findUserByPrincipal({ username }) {
    return Object.values(this.users).find(user => user.username === username);
  }

  async createUser(_ctx, user) {
    this.users[user.uid] = { ...user, rev: 0 };
    return user;
  }

  async updateUser(_ctx, user) {
    this.users[user.uid] = { ...this.users[user.uid], ...user, rev: this.users[user.uid].rev + 1 };
    return user;
  }
}

describe('ProviderService', () => {
  let sut;
  let container;
  let tokenRevocationService;
  let userService;

  beforeEach(async done => {
    sut = new ProviderService();
    tokenRevocationService = {
      isRevoked: jest.fn().mockReturnValue(false),
    };
    userService = new UserServiceMock();
    container = new ServicesContainerMock({
      sut,
      log: {},
      tokenRevocationService,
      userService,
      cognitoAttributeMapperService: {
        mapAttributes: jest.fn(decodedToken => Promise.resolve(decodedToken)),
      },
    });
    await container.initServices();
    done();
  });

  describe('.validateToken', () => {
    it('throws on empty token', async done => {
      try {
        await sut.validateToken({});
      } catch (err) {
        expect(err.message).toBe('no jwt token was provided');
        expect(err.status).toBe(403);
        expect(err.safe).toBe(true);
        done();
        return;
      }
      throw new Error('Expected an exception');
    });

    it('throws on revoked token', async done => {
      try {
        tokenRevocationService.isRevoked.mockReturnValue(true);
        await sut.validateToken({ token: 'revoked' });
      } catch (err) {
        expect(err.message).toBe('The token is revoked');
        expect(err.status).toBe(403);
        expect(err.safe).toBe(true);
        done();
        return;
      }
      throw new Error('Expected an exception');
    });

    it('verifies a correct token', async done => {
      const result = await sut.validateToken({ token: mockToken }, { config: { id: 'todo' } });
      expect(_.omit(result, 'verifiedToken.iat')).toEqual({
        ...mockTokenPayload,
        verifiedToken: { ...mockTokenPayload },
      });
      done();
    });

    describe('SAML user', () => {
      let mockSamlTokenPayload;
      let mockSamlToken;
      beforeEach(() => {
        mockSamlTokenPayload = {
          username: 'test user',
          uid: 'test user',
          identityProviderName: 'testprovider',
          isSamlAuthenticatedUser: true,
        };
        mockSamlToken = jwt.sign(mockSamlTokenPayload, 'mockSecret');
      });

      it('verifies a correct token', async done => {
        const result = await sut.validateToken({ token: mockSamlToken }, { config: { id: 'todo' } });
        expect(_.omit(result, 'verifiedToken.iat')).toEqual({
          ...mockTokenPayload,
          verifiedToken: { ...mockSamlTokenPayload },
        });
        done();
      });

      it('has created an associated user', async done => {
        await sut.validateToken({ token: mockSamlToken }, { config: { id: 'todo' } });
        expect(_.omit(userService.users, `${mockSamlTokenPayload.username}.iat`)).toEqual({
          [mockSamlTokenPayload.username]: {
            ...mockSamlTokenPayload,
            rev: 0,
            authenticationProviderId: 'todo',
          },
        });
        done();
      });

      describe('with updated user attribs', () => {
        let mockSamlTokenPayloadUpdated;
        let mockSamlTokenUpdated;
        beforeEach(async done => {
          mockSamlTokenPayloadUpdated = {
            ...mockSamlTokenPayload,
            newAttribute: 'test',
          };
          mockSamlTokenUpdated = jwt.sign(mockSamlTokenPayloadUpdated, 'mockSecret');
          await sut.validateToken({ token: mockSamlToken }, { config: { id: 'todo' } });
          done();
        });

        it('updates a pre-existing user with new attribs', async done => {
          await sut.validateToken({ token: mockSamlTokenUpdated }, { config: { id: 'todo' } });
          expect(_.omit(userService.users, `${mockSamlTokenPayload.username}.iat`)).toEqual({
            [mockSamlTokenPayload.username]: {
              ...mockSamlTokenPayloadUpdated,
              rev: 1,
              authenticationProviderId: 'todo',
            },
          });
          done();
        });
      });
    });
  });
});
