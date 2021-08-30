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
const { settingKeys, getSetting } = require('../../support/helpers/get-setting');

describe('Create (post) appstream-image scenarios', () => {
  let setup;
  let adminSession;

  beforeAll(async () => {
    setup = await runSetup();
    adminSession = await setup.defaultAdminSession();
  });

  afterAll(async () => {
    await setup.cleanup();
  });

  describe('create image', () => {
    it('should fail for anonymous user', async () => {
      const anonymousSession = await setup.createAnonymousSession();

      await expect(anonymousSession.resources.images.create()).rejects.toMatchObject({
        code: errorCode.http.code.unauthorized,
      });
    });

    it('should fail for guest user', async () => {
      const username = await setup.gen.username();
      const guestSession = await setup.createUserSession({ username });
      const uid = guestSession.user.uid;
      await adminSession.resources.users.user(uid).update({ userRole: 'guest', rev: guestSession.user.rev });
      await expect(
        guestSession.resources.images.create({}, {}, { api: '/api/appstream-images/create', applyDefault: true }),
      ).rejects.toMatchObject({
        code: errorCode.http.code.forbidden,
      });
    });

    it('should fail for power user', async () => {
      const username = await setup.gen.username();
      const powerUserSession = await setup.createUserSession({ username });
      const uid = powerUserSession.user.uid;

      await adminSession.resources.users
        .user(uid)
        .update({ userRole: 'poweruserRole', rev: powerUserSession.user.rev });
      await expect(
        powerUserSession.resources.images.create({}, {}, { api: '/api/appstream-images/create', applyDefault: true }),
      ).rejects.toMatchObject({
        code: errorCode.http.code.forbidden,
      });
    });

    it('should succeed for admin user', async () => {
      await expect(
        adminSession.resources.images.create({}, {}, { api: '/api/appstream-images/create', applyDefault: true }),
      ).resolves.toBeDefined();
    });
  });
});

describe('Share (post) appstream-image scenarios', () => {
  let setup;
  let adminSession;

  beforeAll(async () => {
    setup = await runSetup();
    adminSession = await setup.defaultAdminSession();
  });

  afterAll(async () => {
    await setup.cleanup();
  });

  describe('share image', () => {
    it('should fail for anonymous user', async () => {
      const anonymousSession = await setup.createAnonymousSession();

      await expect(
        anonymousSession.resources.images.create(
          { accountId: -1 },
          {},
          {
            api: `/api/appstream-images/${getSetting(setup, settingKeys.defaultTestImage)}/share`,
            applyDefault: false,
          },
        ),
      ).rejects.toMatchObject({
        code: errorCode.http.code.unauthorized,
      });
    });

    it('should fail for guest user', async () => {
      const username = await setup.gen.username();
      const guestSession = await setup.createUserSession({ username });
      const uid = guestSession.user.uid;
      await adminSession.resources.users.user(uid).update({ userRole: 'guest', rev: guestSession.user.rev });
      await expect(
        guestSession.resources.images.create(
          { accountId: -1 },
          {},
          {
            api: `/api/appstream-images/${getSetting(setup, settingKeys.defaultTestImage)}/share`,
            applyDefault: false,
          },
        ),
      ).rejects.toMatchObject({
        code: errorCode.http.code.forbidden,
      });
    });
  });
});
