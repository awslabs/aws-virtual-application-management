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

/* eslint-disable no-await-in-loop */
/* eslint-disable no-console */
const { runSetup, errorCode } = require('@aws-ee/api-testing-framework');
const { createWaitImage } = require('../../support/complex/create-wait-image');
const { settingKeys, getSetting } = require('../../support/helpers/get-setting');
const getFleetCount = require('../../support/helpers/get-fleet-count');

describe('Delete appstream-fleets scenarios', () => {
  let setup;
  let adminSession;
  let testFleetName;
  let imageName;

  beforeAll(async () => {
    setup = await runSetup();
    adminSession = await setup.defaultAdminSession();
    imageName = getSetting(setup, settingKeys.defaultTestImage);
    createWaitImage(adminSession, imageName);
  });

  afterAll(async () => {
    await setup.cleanup();
  });

  describe('Delete fleet', () => {
    beforeEach(async () => {
      let fleetCount = await getFleetCount(setup.aws);

      // don't attempt to create more fleets than a default AWS account can support.
      while (fleetCount >= 10) {
        await new Promise((resolve) => setTimeout(resolve, 15000));
        fleetCount = await getFleetCount(setup.aws);
      }

      const testFleet = await adminSession.resources.fleets.create(
        { imageName },
        {},
        { api: '/api/appstream-fleets/create', applyDefaults: true },
      );
      testFleetName = testFleet.fleet.name;
    });

    it('should fail for anonymous user', async () => {
      const anonymousSession = await setup.createAnonymousSession();

      await expect(anonymousSession.resources.fleets.fleet(testFleetName).delete()).rejects.toMatchObject({
        code: errorCode.http.code.unauthorized,
      });
    });

    it('should fail for guest user', async () => {
      const username = await setup.gen.username();
      const guestSession = await setup.createUserSession({ username });
      const uid = guestSession.user.uid;
      await adminSession.resources.users.user(uid).update({ userRole: 'guest', rev: guestSession.user.rev });
      await expect(guestSession.resources.fleets.fleet(testFleetName).delete()).rejects.toMatchObject({
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

      // take a few seconds to let the fleet stabilize.
      await new Promise((resolve) => setTimeout(resolve, 20000));
      await expect(powerUserSession.resources.fleets.fleet(testFleetName).delete()).resolves.toBeDefined();
    });

    it('should succeed for admin user', async () => {
      // take a few seconds to let the fleet stabilize.
      await new Promise((resolve) => setTimeout(resolve, 20000));
      await expect(adminSession.resources.fleets.fleet(testFleetName).delete()).resolves.toBeDefined();
    });
  });

  describe('Revoke fleet group access (delete) with bad parameters', () => {
    let groupName;
    beforeEach(async () => {
      groupName = await setup.gen.groupName();
      adminSession = await setup.defaultAdminSession();
      let fleetCount = await getFleetCount(setup.aws);

      // don't attempt to create more fleets than a default AWS account can support.
      while (fleetCount >= 10) {
        await new Promise((resolve) => setTimeout(resolve, 15000));
        fleetCount = await getFleetCount(setup.aws);
      }

      const testFleet = await adminSession.resources.fleets.create(
        { imageName },
        {},
        { api: '/api/appstream-fleets/create', applyDefaults: true },
      );

      testFleetName = testFleet.fleet.name;
    });

    it('should fail for anonymous user', async () => {
      const anonymousSession = await setup.createAnonymousSession();
      console.log(`Removing access for '${groupName}' from '${testFleetName}'`);
      await expect(
        anonymousSession.resources.fleets
          .fleet(testFleetName)
          .delete({ groupName }, { api: `/api/fleets/${testFleetName}/access` }),
      ).rejects.toMatchObject({
        code: errorCode.http.code.unauthorized,
      });
    });

    it('should fail for guest user', async () => {
      const username = await setup.gen.username();
      const guestSession = await setup.createUserSession({ username });
      const uid = guestSession.user.uid;
      console.log(`Removing access for '${groupName}' from '${testFleetName}'`);
      await adminSession.resources.users.user(uid).update({ userRole: 'guest', rev: guestSession.user.rev });
      await expect(
        guestSession.resources.fleets
          .fleet(testFleetName)
          .delete({ groupName }, { api: `/api/fleets/${testFleetName}/access` }),
      ).rejects.toMatchObject({
        code: errorCode.http.code.notFound,
      });
    });

    it('should fail for power user', async () => {
      const username = await setup.gen.username();
      const powerUserSession = await setup.createUserSession({ username });
      const uid = powerUserSession.user.uid;

      console.log(`Removing access for '${groupName}' from '${testFleetName}'`);
      await adminSession.resources.users
        .user(uid)
        .update({ userRole: 'poweruserRole', rev: powerUserSession.user.rev });
      await expect(
        powerUserSession.resources.fleets
          .fleet(testFleetName)
          .delete({ groupName }, { api: `/api/fleets/${testFleetName}/access` }),
      ).rejects.toMatchObject({
        code: errorCode.http.code.notFound,
      });
    });

    it('should fail for admin user', async () => {
      console.log(`Removing access for '${groupName}' from '${testFleetName}'`);
      await expect(
        adminSession.resources.fleets
          .fleet(testFleetName)
          .delete({ groupName }, { api: `/api/fleets/${testFleetName}/access` }),
      ).rejects.toMatchObject({
        code: errorCode.http.code.notFound,
      });
    });
  });
});
