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

// @ts-check

const { runSetup, errorCode } = require('@aws-ee/api-testing-framework');
const { settingKeys, getSetting } = require('../../support/helpers/get-setting');

describe('Delete appstream-image scenarios', () => {
  let setup;
  let adminSession;

  beforeAll(async () => {
    setup = await runSetup();
    adminSession = await setup.defaultAdminSession();
  });

  afterAll(async () => {
    await setup.cleanup();
  });

  describe('delete image', () => {
    it('should fail for anonymous user', async () => {
      const anonymousSession = await setup.createAnonymousSession();
      const image = await adminSession.resources.images.create(
        {},
        {},
        { api: '/api/appstream-images/create', applyDefault: true },
      );
      await expect(anonymousSession.resources.images.image(image.name).delete()).rejects.toMatchObject({
        code: errorCode.http.code.badImplementation,
      });
    });

    it('should fail for guest user', async () => {
      const username = await setup.gen.username();
      const guestSession = await setup.createUserSession({ username });
      const uid = guestSession.user.uid;
      await adminSession.resources.users.user(uid).update({ userRole: 'guest', rev: guestSession.user.rev });
      const image = await adminSession.resources.images.create(
        {},
        {},
        { api: '/api/appstream-images/create', applyDefault: true },
      );
      await expect(guestSession.resources.images.image(image.name).delete()).rejects.toMatchObject({
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

      const image = await adminSession.resources.images.create(
        {},
        {},
        { api: '/api/appstream-images/create', applyDefault: true },
      );
      await expect(powerUserSession.resources.images.image(image.name).delete()).rejects.toMatchObject({
        code: errorCode.http.code.forbidden,
      });
    });

    it('should succeed for admin user', async () => {
      const image = await adminSession.resources.images.create(
        {},
        {},
        { api: '/api/appstream-images/create', applyDefault: true },
      );
      await expect(adminSession.resources.images.image(image.name).delete()).resolves.toBeDefined();
    });
  });

  describe('revoke (delete) image sharing', () => {
    it('should fail for anonymous user', async () => {
      const anonymousSession = await setup.createAnonymousSession();
      const image = await adminSession.resources.images.create(
        {},
        {},
        { api: '/api/appstream-images/create', applyDefault: true },
      );
      await expect(anonymousSession.resources.images.image(image.name).delete()).rejects.toMatchObject({
        code: errorCode.http.code.badImplementation,
      });
    });

    it('should fail for guest user', async () => {
      const username = await setup.gen.username();
      const guestSession = await setup.createUserSession({ username });
      const uid = guestSession.user.uid;
      await adminSession.resources.users.user(uid).update({ userRole: 'guest', rev: guestSession.user.rev });
      const image = await adminSession.resources.images.create(
        {},
        {},
        { api: '/api/appstream-images/create', applyDefault: true },
      );
      await expect(guestSession.resources.images.image(image.name).delete()).rejects.toMatchObject({
        code: errorCode.http.code.forbidden,
      });
    });

    it('should succeed for power user', async () => {
      const username = await setup.gen.username();
      const powerUserSession = await setup.createUserSession({ username });
      const uid = powerUserSession.user.uid;

      await adminSession.resources.users
        .user(uid)
        .update({ userRole: 'poweruserRole', rev: powerUserSession.user.rev });

      await expect(
        powerUserSession.resources.images.delete(
          { accountId: -1 },
          {},
          {
            api: `/api/appstream-images/${getSetting(setup, settingKeys.defaultTestImage)}/share`,
            applyDefault: false,
          },
        ),
      ).rejects.toMatchObject({
        code: errorCode.http.code.badRequest,
      });
    });

    it('should succeed for admin user', async () => {
      await expect(
        adminSession.resources.images.delete(
          { accountId: -1 },
          {},
          {
            api: `/api/appstream-images/${getSetting(setup, settingKeys.defaultTestImage)}/share`,
            applyDefault: false,
          },
        ),
      ).resolves.toBeDefined();
    });
  });
});
