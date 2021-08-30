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

describe('Get current user scenarios', () => {
  let setup;
  let adminSession;

  beforeAll(async () => {
    setup = await runSetup();
    adminSession = await setup.defaultAdminSession();
  });

  afterAll(async () => {
    await setup.cleanup();
  });

  describe('Getting current user', () => {
    it('should fail for anonymous user', async () => {
      const anonymousSession = await setup.createAnonymousSession();

      await expect(anonymousSession.resources.currentUser.get()).rejects.toMatchObject({
        code: errorCode.http.code.badImplementation,
      });
    });

    it('should return current user information if user status is active', async () => {
      const username = await setup.gen.username();
      const guestSession = await setup.createUserSession({ username });

      await expect(guestSession.resources.currentUser.get()).resolves.toMatchObject({ status: 'active', username });
    });

    it('should fail if current user status is inactive', async () => {
      const guestSession = await setup.createUserSession();
      const uid = guestSession.user.uid;

      await adminSession.resources.users.user(uid).update({ status: 'inactive', rev: guestSession.user.rev });
      await expect(guestSession.resources.currentUser.get()).rejects.toMatchObject({
        code: errorCode.http.code.unauthorized,
      });
    });

    it('should fail if current user status is pending', async () => {
      const guestSession = await setup.createUserSession();
      const uid = guestSession.user.uid;

      await adminSession.resources.users.user(uid).update({ status: 'pending', rev: guestSession.user.rev });
      await expect(guestSession.resources.currentUser.get()).rejects.toMatchObject({
        code: errorCode.http.code.unauthorized,
      });
    });
  });
});
