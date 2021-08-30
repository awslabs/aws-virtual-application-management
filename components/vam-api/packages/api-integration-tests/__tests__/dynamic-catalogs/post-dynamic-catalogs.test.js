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

const _ = require('lodash');
const { runSetup, errorCode } = require('@aws-ee/api-testing-framework');
const { createWaitImage } = require('../../support/complex/create-wait-image');
const { settingKeys, getSetting } = require('../../support/helpers/get-setting');

describe('Post (create) dynamic-catalog scenarios', () => {
  let setup;
  let adminSession;

  beforeAll(async () => {
    setup = await runSetup();
    adminSession = await setup.defaultAdminSession();
    const testFleetName = getSetting(setup, settingKeys.defaultTestFleet);
    const fleets = await adminSession.resources.fleets.get();
    const testFleet = _.find(fleets, (f) => f.name === testFleetName);
    if (!testFleet) {
      const testImageName = getSetting(setup, settingKeys.defaultTestImage);
      await createWaitImage(adminSession, testImageName);
      await adminSession.resources.fleets.create(
        { imageName: testImageName, fleetName: testFleetName },
        {},
        { api: '/api/appstream-fleets/create', applyDefaults: true },
      );
    }
  });

  afterAll(async () => {
    await setup.cleanup();
  });

  describe('Create dynamic-catalog list (DAP disabled)', () => {
    it('should fail for anonymous user', async () => {
      const anonymousSession = await setup.createAnonymousSession();

      await expect(
        anonymousSession.resources.dynamicCatalogs.create(
          {},
          {},
          { api: '/api/dynamic-catalogs/create', applyDefauts: true },
        ),
      ).rejects.toMatchObject({
        code: errorCode.http.code.unauthorized,
      });
    });

    it('should fail for guest user (DAP disabled)', async () => {
      const username = await setup.gen.username();
      const guestSession = await setup.createUserSession({ username });
      const uid = guestSession.user.uid;
      await adminSession.resources.users.user(uid).update({ userRole: 'guest', rev: guestSession.user.rev });
      await expect(
        guestSession.resources.dynamicCatalogs.create(
          {},
          {},
          { api: '/api/dynamic-catalogs/create', applyDefauts: true },
        ),
      ).rejects.toMatchObject({
        code: errorCode.http.code.badRequest,
      });
    });

    it('should fail for power user (DAP disabled)', async () => {
      const username = await setup.gen.username();
      const powerUserSession = await setup.createUserSession({ username });
      const uid = powerUserSession.user.uid;

      await adminSession.resources.users
        .user(uid)
        .update({ userRole: 'poweruserRole', rev: powerUserSession.user.rev });
      await expect(
        powerUserSession.resources.dynamicCatalogs.create(
          {},
          {},
          { api: '/api/dynamic-catalogs/create', applyDefauts: true },
        ),
      ).rejects.toMatchObject({
        code: errorCode.http.code.badRequest,
      });
    });

    it('should fail for admin user (DAP disabled)', async () => {
      await expect(
        adminSession.resources.dynamicCatalogs.create(
          {},
          {},
          { api: '/api/dynamic-catalogs/create', applyDefauts: true },
        ),
      ).rejects.toMatchObject({
        code: errorCode.http.code.badRequest,
      });
    });
  });
});
