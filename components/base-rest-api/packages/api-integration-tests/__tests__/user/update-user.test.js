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

const { runSetup, errorCode } = require('@aws-ee/api-testing-framework');

describe('Update current user scenarios', () => {
  let setup;
  let adminSession;

  beforeAll(async () => {
    setup = await runSetup();
    adminSession = await setup.defaultAdminSession();
  });

  afterAll(async () => {
    await setup.cleanup();
  });

  describe('updating current user', () => {
    it('should fail for anonymous user', async () => {
      const anonymousSession = await setup.createAnonymousSession();

      await expect(anonymousSession.resources.currentUser.update({ rev: 0 })).rejects.toMatchObject({
        code: errorCode.http.code.badImplementation,
      });
    });

    it('should fail to update current user if uid does not match uid in request body', async () => {
      const guest1Session = await setup.createUserSession();
      const guest2Session = await setup.createUserSession();
      const guest2Info = await guest2Session.resources.currentUser.get();

      await expect(
        guest1Session.resources.currentUser.update({ uid: guest2Info.uid, rev: 0, status: 'pending' }),
      ).rejects.toMatchObject({
        code: errorCode.http.code.forbidden,
      });
    });

    it.each([{ isSamlAuthenticatedUser: true }, { isAdmin: true }, { userRole: 'admin' }])(
      'should fail if non-admin user update restrictive field %s',
      async (a) => {
        const guestSession = await setup.createUserSession();
        await expect(guestSession.resources.currentUser.update({ rev: 0, ...a })).rejects.toMatchObject({
          code: errorCode.http.code.forbidden,
        });
      },
    );

    it('should not allow inactive user to become active', async () => {
      const guestSession = await setup.createUserSession();
      const { rev, uid } = guestSession.user;

      await adminSession.resources.users.user(uid).update({ rev, status: 'inactive' });
      await expect(guestSession.resources.currentUser.update({ rev: rev + 1, status: 'active' })).rejects.toMatchObject(
        {
          code: errorCode.http.code.unauthorized,
        },
      );
    });

    it('should not allow active user to become pending', async () => {
      const guestSession = await setup.createUserSession();
      const { rev } = guestSession.user;

      await expect(
        guestSession.resources.currentUser.update({ rev: rev + 1, status: 'pending' }),
      ).rejects.toMatchObject({
        code: errorCode.http.code.forbidden,
      });
    });

    it('should not allow inactive user to become pending', async () => {
      const guestSession = await setup.createUserSession();
      const { rev, uid } = guestSession.user;

      await adminSession.resources.users.user(uid).update({ rev, status: 'inactive' });
      await expect(guestSession.resources.currentUser.update({ rev: 1, status: 'pending' })).rejects.toMatchObject({
        code: errorCode.http.code.unauthorized,
      });
    });

    it('should update successfully', async () => {
      const guestSession = await setup.createUserSession();

      await expect(
        guestSession.resources.currentUser.update({ rev: 0, firstName: 'John', lastName: 'Snow' }),
      ).resolves.toMatchObject({
        firstName: 'John',
        lastName: 'Snow',
        rev: 1,
      });
    });
  });
});
