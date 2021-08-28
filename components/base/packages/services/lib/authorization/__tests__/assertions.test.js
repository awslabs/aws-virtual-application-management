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

import { ensureCurrentUserOrAdmin, ensureAdmin, isCurrentUser, ensureCurrentUser } from '../assertions';

describe('assertions', () => {
  describe('.isCurrentUser', () => {
    it('is true when the id is the current user', () => {
      expect(isCurrentUser({ principalIdentifier: { uid: 'testUid' } }, { uid: 'testUid' })).toBe(true);
    });

    it('is false when the id is not the current user', () => {
      expect(isCurrentUser({ principalIdentifier: { uid: 'testUid' } }, { uid: 'not testUid' })).toBe(false);
    });

    it('is false when the id is empty', () => {
      expect(isCurrentUser({ principalIdentifier: { uid: undefined } }, { uid: undefined })).toBe(false);
      expect(isCurrentUser({ principalIdentifier: { uid: null } }, { uid: null })).toBe(false);
      expect(isCurrentUser({ principalIdentifier: { uid: '' } }, { uid: '' })).toBe(false);
    });

    it('is false when the id is not a string', () => {
      expect(isCurrentUser({ principalIdentifier: { uid: true } }, { uid: true })).toBe(false);
      expect(isCurrentUser({ principalIdentifier: { uid: 123 } }, { uid: 123 })).toBe(false);
    });
  });

  describe('.ensureCurrentUserOrAdmin', () => {
    it('succeeds with current user', async () => {
      await ensureCurrentUserOrAdmin({ principalIdentifier: { uid: 'testUid' } }, { uid: 'testUid' });
    });

    it('succeeds with admin', async () => {
      await ensureCurrentUserOrAdmin(
        { principal: { isAdmin: true }, principalIdentifier: { uid: 'testUid' } },
        { uid: 'not testUid' },
      );
    });

    it('booms with neither current nor admin', async () => {
      try {
        await ensureCurrentUserOrAdmin({ principalIdentifier: { uid: 'testUid' } }, { uid: 'not testUid' });
      } catch (err) {
        expect(err.status).toBe(403);
        return;
      }
      throw new Error('Expected an exception');
    });
  });

  describe('.ensureCurrentUser', () => {
    it('succeeds with current user', async () => {
      await ensureCurrentUser({ principalIdentifier: { uid: 'testUid' } }, { uid: 'testUid' });
    });

    it('booms without current user', async () => {
      try {
        await ensureCurrentUser({ principalIdentifier: { uid: 'testUid' } }, { uid: 'not testUid' });
      } catch (err) {
        expect(err.status).toBe(403);
        return;
      }
      throw new Error('Expected an exception');
    });
  });

  describe('.ensureAdmin', () => {
    it('succeeds with admin', async () => {
      await ensureAdmin({ principal: { isAdmin: true } });
    });

    it('booms with not admin', async () => {
      try {
        await ensureAdmin({});
      } catch (err) {
        expect(err.status).toBe(403);
        return;
      }
      throw new Error('Expected an exception');
    });
  });
});
