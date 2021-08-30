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
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const _ = require('lodash');

const errors = require('../errors/error-messages');
const { Settings } = require('../settings/settings');
const { initAws } = require('../aws/init-aws');
const { registerGenerators } = require('./register-generators');
const { registerDefaults } = require('./register-defaults');
const { getClientSession } = require('./client-session');
const { getIdToken } = require('./id-token');

/**
 * This class serves two main purposes:
 * - Contains the logic for the setup that is common to most of the test suites.
 * - The entry point to gain access to the default admin session or create other client sessions
 *
 * In your rests, you can simply use const setup = await runSetup(); to gain access to an instance of
 * this class.
 */
class Setup {
  constructor() {
    this.sessions = [];
  }

  async init() {
    // 1 - Read the global __bootstrap__ object and use it to create the settings object, the __bootstrap__ was
    //     made available in the globals by jest.config.js file
    // 2 - Use the adminIdToken from settings, to create the default admin session

    // eslint-disable-next-line no-undef
    const settingsMementoInGlobal = _.get(__bootstrap__, 'settingsMemento');
    if (_.isEmpty(settingsMementoInGlobal)) throw errors.missingSettingsMemento();

    // eslint-disable-next-line no-undef
    this.dependencyGraph = _.get(__bootstrap__, 'dependencyGraph');

    // Restore the settings registry from the memento that we stored in jest globals
    const settings = new Settings();
    settings.setMemento(settingsMementoInGlobal);
    this.settings = settings;

    // aws instance
    this.aws = await initAws({ settings, dependencyGraph: this.dependencyGraph });

    // Register generators
    // IMPORTANT: these generators have nothing to do with the ES6 generators.
    // The generators here are simply helper functions that return values that we can use in the tests, for example,
    // generating user names, etc.
    const { registry: genRegistry, generators } = await registerGenerators({ setup: this });
    this.gen = generators;
    this.genRegistry = genRegistry;

    // Register default values
    const { registry: defaultsRegistry, defaults } = await registerDefaults({ setup: this });
    this.defaults = defaults;
    this.defaultsRegistry = defaultsRegistry;
  }

  async defaultAdminSession() {
    // Only create a new client session if we haven't done that already
    if (this.defaultAdminSessionInstance) return this.defaultAdminSessionInstance;

    const idToken = this.settings.get('adminIdToken');
    // In the future, we can check if the token expired and if so, we can create a new one
    const session = await getClientSession({ idToken, setup: this });
    this.sessions.push(session);
    this.defaultAdminSessionInstance = session;

    return session;
  }

  async createAdminSession() {
    const adminSession = await this.defaultAdminSession();
    const username = this.gen.username({ tagPrefix: 'test-admin' });
    const password = this.gen.password();
    const authenticationProviderId = this.settings.get('authenticationProviderId');

    await adminSession.resources.users.create({
      email: username,
      temporaryPassword: password,
      authenticationProviderId,
      isAdmin: true,
      userRole: 'admin',
    });

    const idToken = await getIdToken({ aws: this.aws, username, password });
    const session = await getClientSession({ idToken, setup: this });
    this.sessions.push(session);

    return session;
  }

  /**
   * @param {string} sessionType to return
   * @returns session of specified type */
  async createSession(sessionType) {
    const adminSession = await this.defaultAdminSession();
    const updateSessionWithStatus = (session) => async (status) => {
      await adminSession.resources.users.user(session.user.uid).update({ status, rev: session.user.rev });
      return session;
    };
    const createAdminSessionWithStatus = updateSessionWithStatus(await this.createAdminSession());
    const createUserSessionWithStatus = updateSessionWithStatus(await this.createUserSession());
    switch (sessionType) {
      case 'admin':
        return this.createAdminSession();
      case 'user':
        return this.createUserSession();
      case 'anonymous':
        return this.createAnonymousSession();
      case 'inactiveAdmin':
        return createAdminSessionWithStatus('inactive');
      case 'pendingAdmin':
        return createAdminSessionWithStatus('pending');
      case 'inactiveUser':
        return createUserSessionWithStatus('inactive');
      case 'pendingUser':
        return createUserSessionWithStatus('pending');
      default:
        return this.createAnonymousSession();
    }
  }

  async createAnonymousSession() {
    const session = await getClientSession({ setup: this });
    this.sessions.push(session);

    return session;
  }

  async createUserSession({ userRole = 'guest', username = this.gen.username(), password = this.gen.password() } = {}) {
    const adminSession = await this.defaultAdminSession();
    const authenticationProviderId = this.settings.get('authenticationProviderId');

    await adminSession.resources.users.create({
      email: username,
      temporaryPassword: password,
      authenticationProviderId,
      userRole,
    });
    const idToken = await getIdToken({ aws: this.aws, username, password });
    const session = await getClientSession({ idToken, setup: this });
    this.sessions.push(session);

    return session;
  }

  async cleanup() {
    // We need to reverse the order of the queue before we cleanup the sessions
    const sessions = _.reverse(_.slice(this.sessions));

    for (const session of sessions) {
      try {
        await session.cleanup();
      } catch (error) {
        console.error(error);
      }
    }

    this.sessions = []; // This way if the cleanup() method is called again, we don't need to cleanup again
  }
}

/**
 * Use this function to gain access to a setup instance that is initialized and ready to be used.
 */
async function runSetup() {
  const setupInstance = new Setup();
  await setupInstance.init();

  return setupInstance;
}

module.exports = { runSetup };
