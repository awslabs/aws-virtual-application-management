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

describe('Delete dynamic-catalog scenarios', () => {
  let setup;
  let adminSession;
  let catName;
  let groupName;

  beforeAll(async () => {
    setup = await runSetup();
    adminSession = await setup.defaultAdminSession();
  });

  afterAll(async () => {
    await setup.cleanup();
  });

  describe('Delete dynamic-catalog list with bad parameters', () => {
    beforeEach(async () => {
      catName = await setup.gen.dynamicCatalogName();
    });

    it('should fail for anonymous user', async () => {
      const anonymousSession = await setup.createAnonymousSession();
      await expect(anonymousSession.resources.dynamicCatalogs.dynamicCatalog(catName).delete()).rejects.toMatchObject({
        code: errorCode.http.code.unauthorized,
      });
    });

    it('should fail for guest user', async () => {
      const username = await setup.gen.username();
      const guestSession = await setup.createUserSession({ username });
      const uid = guestSession.user.uid;
      await adminSession.resources.users.user(uid).update({ userRole: 'guest', rev: guestSession.user.rev });
      await expect(guestSession.resources.dynamicCatalogs.dynamicCatalog(catName).delete()).rejects.toMatchObject({
        code: errorCode.http.code.badRequest,
      });
    });

    it('should succeed for power user', async () => {
      const username = await setup.gen.username();
      const powerUserSession = await setup.createUserSession({ username });
      const uid = powerUserSession.user.uid;

      await adminSession.resources.users
        .user(uid)
        .update({ userRole: 'poweruserRole', rev: powerUserSession.user.rev });
      await expect(powerUserSession.resources.dynamicCatalogs.dynamicCatalog(catName).delete()).rejects.toMatchObject({
        code: errorCode.http.code.badRequest,
      });
    });

    it('should succeed for admin user', async () => {
      await expect(adminSession.resources.dynamicCatalogs.dynamicCatalog(catName).delete()).rejects.toMatchObject({
        code: errorCode.http.code.badRequest,
      });
    });
  });

  describe('Revoke (delete) dynamic-catalog list group access with bad parameters', () => {
    beforeEach(async () => {
      catName = await setup.gen.dynamicCatalogName();
      groupName = await setup.gen.groupName();
    });

    it('should fail for anonymous user', async () => {
      const anonymousSession = await setup.createAnonymousSession();

      await expect(
        anonymousSession.resources.dynamicCatalogs
          .dynamicCatalog(catName)
          .delete({ groupName }, {}, { api: `/api/dynamic-catalogs/${catName}/access` }),
      ).rejects.toMatchObject({
        code: errorCode.http.code.unauthorized,
      });
    });

    it('should fail for guest user', async () => {
      const username = await setup.gen.username();
      const guestSession = await setup.createUserSession({ username });
      const uid = guestSession.user.uid;
      await adminSession.resources.users.user(uid).delete({ userRole: 'guest', rev: guestSession.user.rev });
      await expect(
        guestSession.resources.dynamicCatalogs
          .dynamicCatalog(catName)
          .update({ groupName }, {}, { api: `/api/dynamic-catalogs/${catName}/access` }),
      ).rejects.toMatchObject({
        code: errorCode.http.code.unauthorized,
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
        powerUserSession.resources.dynamicCatalogs
          .dynamicCatalog(catName)
          .delete({ groupName }, {}, { api: `/api/dynamic-catalogs/${catName}/access` }),
      ).rejects.toMatchObject({
        code: errorCode.http.code.badRequest,
      });
    });

    it('should fail for admin user', async () => {
      await expect(
        adminSession.resources.dynamicCatalogs
          .dynamicCatalog(catName)
          .delete({ groupName }, {}, { api: `/api/dynamic-catalogs/${catName}/access` }),
      ).rejects.toMatchObject({
        code: errorCode.http.code.badRequest,
      });
    });
  });
});
