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

/* eslint-disable no-console */
/* eslint-disable no-constant-condition */
/* eslint-disable no-await-in-loop */
const _ = require('lodash');
const { runSetup, errorCode } = require('@aws-ee/api-testing-framework');
const { createWaitImage } = require('../../support/complex/create-wait-image');
const { settingKeys, getSetting } = require('../../support/helpers/get-setting');
const getFleetCount = require('../../support/helpers/get-fleet-count');

describe('Start/Stop/Add Group Access/Swap Image (put) appstream-image scenarios', () => {
  let setup;
  let adminSession;
  let engineeringTestFleet;
  let groupName;

  beforeAll(async () => {
    setup = await runSetup();
    adminSession = await setup.defaultAdminSession();
    createWaitImage(adminSession, getSetting(setup, settingKeys.defaultTestImage));
    const fleets = await adminSession.resources.fleets.get();
    engineeringTestFleet = _.find(fleets, (fleet) => {
      return fleet.name === getSetting(setup, settingKeys.defaultTestFleet);
    });
    if (!engineeringTestFleet) {
      engineeringTestFleet = await adminSession.resources.fleets.create(
        { fleetName: getSetting(setup, settingKeys.defaultTestFleet) },
        {},
        { api: '/api/appstream-fleets/create', applyDefaults: true },
      );
    }
  });

  afterAll(async () => {
    await setup.cleanup();
  });

  describe('Start fleet', () => {
    let testFleetName;

    beforeEach(async () => {
      adminSession = await setup.defaultAdminSession();
      let fleetCount = await getFleetCount(setup.aws);

      // don't attempt to create more fleets than a default AWS account can support.
      while (fleetCount >= 10) {
        console.log(`JEST: ${process.env.JEST_WORKER_ID}: FleetCount: ${fleetCount}, Waiting for 15 seconds.`);
        await new Promise((resolve) => setTimeout(resolve, 15000));
        fleetCount = await getFleetCount(setup.aws);
      }

      const fleet = await adminSession.resources.fleets.create(
        {},
        {},
        { api: '/api/appstream-fleets/create', applyDefault: true },
      );
      testFleetName = _.get(fleet, 'fleet.name');

      let testFleetState = 'PROCESSING';

      // wait for test fleet to move from PROCESSING to STOPPED state.
      do {
        const fleets = await adminSession.resources.fleets.get();
        // eslint-disable-next-line no-loop-func
        const testFleet = _.find(fleets, (f) => {
          return f.name === testFleetName;
        });

        testFleetState = _.get(testFleet, 'state');

        // for new fleets, this should never happen.
        if (testFleetState === 'RUNNING') {
          await adminSession.resources.fleets.update({ testFleetName }, {}, { api: '/api/appstream-fleets/stop' });
        }
        console.log(
          `JEST: ${process.env.JEST_WORKER_ID}: '${testFleetName}' in '${testFleetState}', Waiting for 15 seconds.`,
        );
        await new Promise((resolve) => setTimeout(resolve, 15000));
      } while (testFleetState && testFleetState !== 'STOPPED');
    });

    afterEach(async () => {
      adminSession = await setup.defaultAdminSession();

      let testFleetState = 'PROCESSING';

      do {
        const fleets = await adminSession.resources.fleets.get();

        // eslint-disable-next-line no-loop-func
        const testFleet = _.find(fleets, (f) => f.name === testFleetName);
        testFleetState = _.get(testFleet, 'state');

        if (testFleetState === 'RUNNING') {
          // give the fleet 30 seconds to stabilize
          await new Promise((resolve) => setTimeout(resolve, 30000));
          await adminSession.resources.fleets.update({ testFleetName }, {}, { api: '/api/appstream-fleets/stop' });
        }
        console.log(
          `JEST: ${process.env.JEST_WORKER_ID}: '${testFleetName}' in '${testFleetState}', Waiting for 15 seconds.`,
        );
        await new Promise((resolve) => setTimeout(resolve, 15000));
      } while (testFleetState && testFleetState !== 'STOPPED');

      // wait some additional time before attempting to delete the fleet
      await new Promise((resolve) => setTimeout(resolve, 30000));
      try {
        await adminSession.resources.fleets.fleet(testFleetName).delete();
      } catch (err) {
        console.log(err);
        console.log('Image to be deleted during test suite cleanup. Ignoring...');
      }
    });

    it('should fail for anonymous user', async () => {
      const anonymousSession = await setup.createAnonymousSession();

      await expect(
        anonymousSession.resources.fleets.update(
          { fleetName: testFleetName },
          {},
          { api: '/api/appstream-fleets/start' },
        ),
      ).rejects.toMatchObject({
        code: errorCode.http.code.unauthorized,
      });
    });

    it('should fail for guest user', async () => {
      adminSession = await setup.defaultAdminSession();
      const username = await setup.gen.username();
      const guestSession = await setup.createUserSession({ username });
      const uid = guestSession.user.uid;
      await adminSession.resources.users.user(uid).update({ userRole: 'guest', rev: guestSession.user.rev });
      await expect(
        guestSession.resources.fleets.update({ fleetName: testFleetName }, {}, { api: '/api/appstream-fleets/start' }),
      ).rejects.toMatchObject({
        code: errorCode.http.code.forbidden,
      });
    });

    it('should succeed for power user', async () => {
      adminSession = await setup.defaultAdminSession();
      const username = await setup.gen.username();
      const powerUserSession = await setup.createUserSession({ username });
      const uid = powerUserSession.user.uid;
      await adminSession.resources.users
        .user(uid)
        .update({ userRole: 'poweruserRole', rev: powerUserSession.user.rev });
      await new Promise((resolve) => setTimeout(resolve, 30000));
      await expect(
        powerUserSession.resources.fleets.update(
          { fleetName: testFleetName },
          {},
          { api: '/api/appstream-fleets/start' },
        ),
      ).resolves.toBeDefined();
    });

    it('should succeeed for admin user', async () => {
      adminSession = await setup.defaultAdminSession();
      await new Promise((resolve) => setTimeout(resolve, 30000));
      await expect(
        adminSession.resources.fleets.update({ fleetName: testFleetName }, {}, { api: '/api/appstream-fleet/start' }),
      ).resolves.toBeDefined();
    });
  });

  describe('Stop fleet', () => {
    let testFleetName;

    beforeEach(async () => {
      adminSession = await setup.defaultAdminSession();
      let fleetCount = await getFleetCount(setup.aws);

      // don't attempt to create more fleets than a default AWS account can support.
      while (fleetCount >= 10) {
        console.log(`JEST: ${process.env.JEST_WORKER_ID}: FleetCount: ${fleetCount}, Waiting for 15 seconds.`);
        await new Promise((resolve) => setTimeout(resolve, 15000));
        fleetCount = await getFleetCount(setup.aws);
      }

      const fleet = await adminSession.resources.fleets.create(
        {},
        {},
        { api: '/api/appstream-fleets/create', applyDefault: true },
      );
      testFleetName = _.get(fleet, 'fleet.name');

      let testFleetState = 'PROCESSING';

      // wait for test fleet to move from PROCESSING to STOPPED state.
      do {
        const fleets = await adminSession.resources.fleets.get();
        // eslint-disable-next-line no-loop-func
        const testFleet = _.find(fleets, (f) => {
          return f.name === testFleetName;
        });

        testFleetState = _.get(testFleet, 'state');

        // for new fleets, this should never happen.
        if (testFleetState === 'RUNNING') {
          await adminSession.resources.fleets.update({ testFleetName }, {}, { api: '/api/appstream-fleets/stop' });
        }
        console.log(
          `JEST: ${process.env.JEST_WORKER_ID}: '${testFleetName}' in '${testFleetState}', Waiting for 15 seconds.`,
        );
        await new Promise((resolve) => setTimeout(resolve, 15000));
      } while (testFleetState && testFleetState !== 'STOPPED');

      await new Promise((resolve) => setTimeout(resolve, 15000));
    });

    afterEach(async () => {
      adminSession = await setup.defaultAdminSession();

      let testFleetState = 'PROCESSING';

      do {
        const fleets = await adminSession.resources.fleets.get();

        // eslint-disable-next-line no-loop-func
        const testFleet = _.find(fleets, (f) => f.name === testFleetName);
        testFleetState = _.get(testFleet, 'state');

        if (testFleetState === 'RUNNING') {
          await new Promise((resolve) => setTimeout(resolve, 30000));
          await adminSession.resources.fleets.update({ testFleetName }, {}, { api: '/api/appstream-fleets/stop' });
        }
        console.log(
          `JEST: ${process.env.JEST_WORKER_ID}: '${testFleetName}' in '${testFleetState}', Waiting for 15 seconds.`,
        );
        await new Promise((resolve) => setTimeout(resolve, 15000));
      } while (testFleetState && testFleetState !== 'STOPPED');

      // wait some additional time before attempting to delete the fleet
      await new Promise((resolve) => setTimeout(resolve, 30000));
      try {
        await adminSession.resources.fleets.fleet(testFleetName).delete();
      } catch (err) {
        console.log(err);
        console.log('Image to be deleted during test suite cleanup. Ignoring...');
      }
    });

    it('should fail for anonymous user', async () => {
      const anonymousSession = await setup.createAnonymousSession();

      await expect(
        anonymousSession.resources.fleets.update(
          { fleetName: testFleetName },
          {},
          { api: '/api/appstream-fleets/stop' },
        ),
      ).rejects.toMatchObject({
        code: errorCode.http.code.unauthorized,
      });
    });

    it('should fail for guest user', async () => {
      adminSession = await setup.defaultAdminSession();
      const username = await setup.gen.username();
      const guestSession = await setup.createUserSession({ username });
      const uid = guestSession.user.uid;
      await adminSession.resources.users.user(uid).update({ userRole: 'guest', rev: guestSession.user.rev });
      await expect(
        guestSession.resources.fleets.update({ fleetName: testFleetName }, {}, { api: '/api/appstream-fleets/stop' }),
      ).rejects.toMatchObject({
        code: errorCode.http.code.forbidden,
      });
    });

    it('should succeed for power user', async () => {
      adminSession = await setup.defaultAdminSession();
      const username = await setup.gen.username();
      const powerUserSession = await setup.createUserSession({ username });
      const uid = powerUserSession.user.uid;
      await adminSession.resources.users
        .user(uid)
        .update({ userRole: 'poweruserRole', rev: powerUserSession.user.rev });
      await new Promise((resolve) => setTimeout(resolve, 30000));
      await expect(
        powerUserSession.resources.fleets.update(
          { fleetName: testFleetName },
          {},
          { api: '/api/appstream-fleets/stop' },
        ),
      ).resolves.toBeDefined();
    });

    it('should succeed for admin user', async () => {
      adminSession = await setup.defaultAdminSession();
      await expect(
        adminSession.resources.fleets.update({ fleetName: testFleetName }, {}, { api: '/api/appstream-fleets/stop' }),
      ).toBeDefined();
    });
  });

  describe('Swap fleet image', () => {
    let testFleetName;

    beforeAll(async () => {
      adminSession = await setup.defaultAdminSession();
      await createWaitImage(adminSession, getSetting(setup, settingKeys.defaultTestImage));
      await createWaitImage(adminSession, getSetting(setup, settingKeys.defaultSwapImage));
    });

    beforeEach(async () => {
      adminSession = await setup.defaultAdminSession();
      let fleetCount = await getFleetCount(setup.aws);

      // don't attempt to create more fleets than a default AWS account can support.
      while (fleetCount >= 10) {
        console.log(`JEST: ${process.env.JEST_WORKER_ID}: FleetCount: ${fleetCount}, Waiting for 15 seconds.`);
        await new Promise((resolve) => setTimeout(resolve, 15000));
        fleetCount = await getFleetCount(setup.aws);
      }

      const testFleet = await adminSession.resources.fleets.create(
        { imageName: getSetting(setup, settingKeys.defaultTestImage) },
        {},
        { api: '/api/appstream-fleets/create', applyDefaults: true },
      );

      testFleetName = testFleet.fleet.name;
    });

    afterEach(async () => {
      adminSession = await setup.defaultAdminSession();

      let testFleetState = 'PROCESSING';

      do {
        const fleets = await adminSession.resources.fleets.get();

        // eslint-disable-next-line no-loop-func
        const testFleet = _.find(fleets, (f) => f.name === testFleetName);
        testFleetState = _.get(testFleet, 'state');

        if (testFleetState === 'RUNNING') {
          await new Promise((resolve) => setTimeout(resolve, 30000));
          await adminSession.resources.fleets.update({ testFleetName }, {}, { api: '/api/appstream-fleets/stop' });
        }
        console.log(
          `JEST: ${process.env.JEST_WORKER_ID}: '${testFleetName}' in '${testFleetState}', Waiting for 15 seconds.`,
        );
        await new Promise((resolve) => setTimeout(resolve, 15000));
      } while (testFleetState && testFleetState !== 'STOPPED');

      // wait some additional time before attempting to delete the fleet
      await new Promise((resolve) => setTimeout(resolve, 30000));
      try {
        await adminSession.resources.fleets.fleet(testFleetName).delete();
      } catch (err) {
        console.log(err);
        console.log('Image to be deleted during test suite cleanup. Ignoring...');
      }
    });

    it('should fail for anonymous user', async () => {
      const anonymousSession = await setup.createAnonymousSession();

      await expect(
        anonymousSession.resources.fleets
          .fleet(testFleetName)
          .update(
            { imageName: getSetting(setup, settingKeys.defaultSwapImage) },
            {},
            { api: `api/appstream-fleets/${testFleetName}/swap-image` },
          ),
      ).rejects.toMatchObject({
        code: errorCode.http.code.unauthorized,
      });
    });

    it('should fail for guest user', async () => {
      adminSession = await setup.defaultAdminSession();
      const username = await setup.gen.username();
      const guestSession = await setup.createUserSession({ username });
      const uid = guestSession.user.uid;
      await adminSession.resources.users.user(uid).update({ userRole: 'guest', rev: guestSession.user.rev });
      await expect(
        guestSession.resources.fleets
          .fleet(testFleetName)
          .update(
            { imageName: getSetting(setup, settingKeys.defaultSwapImage) },
            {},
            { api: `api/appstream-fleets/${testFleetName}/swap-image` },
          ),
      ).rejects.toMatchObject({
        code: errorCode.http.code.forbidden,
      });
    });

    it('should succeed for poweruser', async () => {
      adminSession = await setup.defaultAdminSession();
      const username = setup.gen.username();
      const powerUserSession = await setup.createUserSession({ username });
      const uid = powerUserSession.user.uid;
      await adminSession.resources.users
        .user(uid)
        .update({ userRole: 'poweruserRole', rev: powerUserSession.user.rev });
      // sleep for a few seconds for new fleet to stabilize.
      await new Promise((resolve) => setTimeout(resolve, 30000));
      await expect(
        powerUserSession.resources.fleets
          .fleet(testFleetName)
          .update(
            { imageName: getSetting(setup, settingKeys.defaultSwapImage) },
            {},
            { api: `api/appstream-fleets/${testFleetName}/swap-image` },
          ),
      ).resolves.toBeDefined();
    });

    it('should succeed for admin', async () => {
      // sleep for a few seconds for new fleet to stabilize.
      await new Promise((resolve) => setTimeout(resolve, 30000));
      await expect(
        adminSession.resources.fleets
          .fleet(testFleetName)
          .update(
            { imageName: getSetting(setup, settingKeys.defaultSwapImage) },
            {},
            { api: `api/appstream-fleets/${testFleetName}/swap-image` },
          ),
      ).resolves.toBeDefined();
    });
  });

  describe('Grant fleet group access (put) with bad parameters', () => {
    let testFleetName;

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
        { imageName: getSetting(setup, settingKeys.defaultTestImage) },
        {},
        { api: '/api/appstream-fleets/create', applyDefaults: true },
      );

      testFleetName = testFleet.fleet.name;
    });

    afterEach(async () => {
      adminSession = await setup.defaultAdminSession();

      let testFleetState = 'PROCESSING';

      do {
        const fleets = await adminSession.resources.fleets.get();

        // eslint-disable-next-line no-loop-func
        const testFleet = _.find(fleets, (f) => f.name === testFleetName);
        testFleetState = _.get(testFleet, 'state');

        if (testFleetState === 'RUNNING') {
          await adminSession.resources.fleets.update({ testFleetName }, {}, { api: '/api/appstream-fleets/stop' });
        }

        console.log(
          `JEST: ${process.env.JEST_WORKER_ID}: '${testFleetName}' in '${testFleetState}', Waiting for 15 seconds.`,
        );
        await new Promise((resolve) => setTimeout(resolve, 15000));
      } while (testFleetState && testFleetState !== 'STOPPED');

      // wait some additional time before attempting to delete the fleet
      await new Promise((resolve) => setTimeout(resolve, 30000));

      try {
        await adminSession.resources.fleets.fleet(testFleetName).delete();
      } catch (err) {
        console.log(err);
        console.log('Fleet will be deleted in test suite cleanup, ignoring...');
      }
    });

    it('should fail for anonymous user', async () => {
      const anonymousSession = await setup.createAnonymousSession();

      await expect(
        anonymousSession.resources.fleets
          .fleet(testFleetName)
          .update({ groupName }, {}, { api: `/api/fleets/${testFleetName}/access` }),
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
        guestSession.resources.fleets
          .fleet(testFleetName)
          .update({ groupName }, {}, { api: `/api/fleets/${testFleetName}/access` }),
      ).rejects.toMatchObject({
        code: errorCode.http.code.notFound,
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
        powerUserSession.resources.fleets
          .fleet(testFleetName)
          .update({ groupName }, {}, { api: `/api/fleets/${testFleetName}/access` }),
      ).rejects.toMatchObject({
        code: errorCode.http.code.notFound,
      });
    });

    it('should fail for admin user', async () => {
      await expect(
        adminSession.resources.fleets
          .fleet(testFleetName)
          .update({ groupName }, {}, { api: `/api/fleets/${testFleetName}/access` }),
      ).rejects.toMatchObject({
        code: errorCode.http.code.notFound,
      });
    });
  });
});
