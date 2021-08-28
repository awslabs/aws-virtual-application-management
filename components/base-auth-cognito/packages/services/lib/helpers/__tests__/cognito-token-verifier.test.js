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

import requestMock from 'request';
import jwt from 'jsonwebtoken';
import { getCognitoTokenVerifier } from '../cognito-token-verifier';

const mockUserPoolUri = 'http://example.com';
const mockKey = {
  p: 'y7UUsSycEVqIEi1SvzG_NQvYK4joEUBQjhf6cAyuf-0',
  kty: 'RSA',
  q: 'xpUh6coJy_a5tYm945H4vcb_OrmROjEp0YRDEu06NCM',
  d: 'Opt_8p8NQfIGFrBFoqA_AHIZKexA2Of_Q0-Occs_03sdfO6OPiuQfNnoJVknRuScOXqQv2T0Pl8RLlQWXV6aiQ',
  e: 'AQAB',
  kid: 'mockKeyId',
  qi: 'hqEWPaRiyh2AntzbNuP0tx9RS-q2nsWrySb66NeiwR0',
  dp: 'N6Nh33J7vhGoEK7oZuhDfU2a4WknWW7jkavi7y_HiZE',
  dq: 'Gr5W1N9qtldB51rngdBUyWoVUVlQX5_jW94OEmx0XDU',
  n: 'ngS5YnPfBkJJ1iD36Q9ngTT7azg3lClp1Ab4NcXcEp2PTKAl1bZlZP97RDI6j9up4Voqnei1VbrIOnGGkomhZw',
};
const mockPK =
  '-----BEGIN PUBLIC KEY-----\n' +
  'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAJ4EuWJz3wZCSdYg9+kPZ4E0+2s4N5Qp\n' +
  'adQG+DXF3BKdj0ygJdW2ZWT/e0QyOo/bqeFaKp3otVW6yDpxhpKJoWcCAwEAAQ==\n' +
  '-----END PUBLIC KEY-----\n';
const mockKeyResponse = { response: { statusCode: 200 }, body: { keys: [mockKey] } };

describe('getCognitoTokenVerifier', () => {
  let verify;
  let logger;
  beforeEach(async done => {
    logger = { error: jest.fn() };
    requestMock('setup', mockKeyResponse);
    verify = (await getCognitoTokenVerifier(mockUserPoolUri, logger)).verify;
    done();
  });

  it('throws on an invalid token', async done => {
    try {
      await verify('invalid');
    } catch (err) {
      expect(err.message.includes('Could not decode the token')).toBe(true);
      done();
      return;
    }

    throw new Error('Expected an exception');
  });

  it('throws on a token from the wrong issuer', async done => {
    try {
      const token = jwt.sign({ iss: 'unknown Issuer' }, mockPK);
      await verify(token);
    } catch (err) {
      expect(err.message.includes('not issued by the trusted source')).toBe(true);
      done();
      return;
    }

    throw new Error('Expected an exception');
  });

  it('throws on a token that is not the id token', async done => {
    try {
      const token = jwt.sign({ iss: mockUserPoolUri, token_use: 'invalid' }, mockPK);
      await verify(token);
    } catch (err) {
      expect(err.message.includes('is not the identity token')).toBe(true);
      done();
      return;
    }

    throw new Error('Expected an exception');
  });

  it('throws on a token with a wrong key id', async done => {
    try {
      const token = jwt.sign({ iss: mockUserPoolUri, token_use: 'id' }, mockPK, { keyid: 'invalid' });
      await verify(token);
    } catch (err) {
      expect(err.message.includes('No valid key available')).toBe(true);
      done();
      return;
    }

    throw new Error('Expected an exception');
  });
});
