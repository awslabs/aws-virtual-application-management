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

import _ from 'lodash';
import { Service } from '@aws-ee/base-services-container';
import { runAndCatch, generateId, processInBatches } from '../helpers/utils';
import { toUserNamespace } from './helpers/user-namespace';
import { ensureCurrentUser } from '../authorization/assertions';
import createUserJsonSchema from '../schema/create-user.json';
import updateUserJsonSchema from '../schema/update-user.json';

const settingKeys = {
  tableName: 'dbUsers',
};

class UserService extends Service {
  constructor() {
    super();
    this.dependency([
      'aws',
      'dbService',
      'authorizationService',
      'userAuthzService',
      'auditWriterService',
      'jsonSchemaValidationService',
      'userRolesService',
      'pluginRegistryService',
    ]);
  }

  async init() {
    await super.init();
    const [userAuthzService] = await this.service(['userAuthzService']);

    this.userExistsErrorMsg = 'Cannot add user. The user already exists.';

    // A private authorization condition function that just delegates to the userAuthzService
    this.allowAuthorized = (requestContext, { resource, action, effect, reason }, ...args) =>
      userAuthzService.authorize(requestContext, { resource, action, effect, reason }, ...args);
  }

  async createUser(requestContext, user) {
    // ensure that the caller has permissions to create the user
    // The following will result in checking permissions by calling the condition function "this.allowAuthorized" first
    await this.assertAuthorized(requestContext, { action: 'create', conditions: [this.allowAuthorized] }, user);

    // Validate input
    await this.validateCreateUser(requestContext, user);

    // Set default attributes (such as "isAdmin" flag and "status") on the user being created
    await this.setDefaultAttributes(requestContext, user);

    const { username } = user;
    const ns = toUserNamespace(user.authenticationProviderId, user.identityProviderName);
    const existingUser = await this.getUserByPrincipal({ username, ns });
    if (existingUser) {
      throw this.boom.alreadyExists(this.userExistsErrorMsg, true);
    }

    // Run logic from any user management plugins
    const pluginRegistryService = await this.service('pluginRegistryService');
    const userRecord = await pluginRegistryService.visitPlugins(
      'user-management',
      'createUser',
      {
        payload: user,
      },
      { container: this.container },
    );
    if (_.has(userRecord, 'temporaryPassword')) {
      delete userRecord.temporaryPassword;
    }

    // Generate user ID if needed
    const uid = _.get(userRecord, 'uid', await generateId('u='));

    // Create user record in Users table
    const dbService = await this.service('dbService');
    const table = this.settings.get(settingKeys.tableName);

    const by = _.get(requestContext, 'principalIdentifier.uid');

    const result = await dbService.helper
      .updater()
      .table(table)
      .condition('attribute_not_exists(uid)')
      .key({ uid })
      .item({
        ...userRecord,
        ns,
        rev: 0,
        createdBy: by,
      })
      .update();

    // Write audit event
    await this.audit(requestContext, { action: 'create-user', body: result });
    return result;
  }

  /**
   * Method to create users in bulk in the specified number of batches. The method will try to create users in parallel
   * within a given batch but will not start new batch until a previous batch is complete.
   *
   * @param requestContext
   * @param users
   * @param defaultAuthNProviderId
   * @param batchSize
   * @returns {Promise<Array>}
   */
  async createUsers(requestContext, users, defaultAuthNProviderId, batchSize = 5) {
    // ensure that the caller has permissions to create user
    await this.assertAuthorized(requestContext, { action: 'createBulk', conditions: [this.allowAuthorized] }, users);

    const errorMsgs = [];
    let successCount = 0;
    let errorCount = 0;
    let internalErrorOccurred = false;
    const createUser = async curUser => {
      try {
        const authenticationProviderId =
          curUser.authenticationProviderId ||
          defaultAuthNProviderId ||
          requestContext.principal.authenticationProviderId;
        const name = await this.toDefaultName(curUser.email);
        const userType = await this.toUserType(requestContext, curUser.userRole);
        curUser.firstName = _.isEmpty(curUser.firstName) ? name : curUser.firstName;
        curUser.lastName = _.isEmpty(curUser.lastName) ? name : curUser.lastName;
        curUser.authenticationProviderId = authenticationProviderId;
        curUser.isExternalUser = userType === 'EXTERNAL';

        await this.createUser(requestContext, curUser);
        successCount += 1;
      } catch (error) {
        const email = _.get(curUser, 'email', 'UNKNOWN');
        const errorMsg = error.safe // if error is boom error then see if it is safe to propagate it's message
          ? `Error creating user with email "${email}". ${error.message}`
          : `Error creating user with email "${email}"`;

        errorMsgs.push(errorMsg);
        if (error.status.toString().startsWith('5')) {
          internalErrorOccurred = true;
        }
        errorCount += 1;
      }
    };
    // Create users in parallel in the specified batches
    await processInBatches(users, batchSize, createUser);
    if (!_.isEmpty(errorMsgs)) {
      const boomError = internalErrorOccurred ? this.boom.internalError : this.boom.badRequest;
      throw boomError(`Errors creating users in bulk`, true).withPayload(errorMsgs);
    }

    // Write audit event
    await this.audit(requestContext, { action: 'create-users-batch', body: { totalUsers: _.size(users) } });

    return { successCount, errorCount };
  }

  async updateUser(requestContext, user) {
    // ensure that the caller has permissions to update the user
    // The following will result in checking permissions by calling the condition function "this.allowAuthorized" first
    await this.assertAuthorized(requestContext, { action: 'update', conditions: [this.allowAuthorized] }, user);

    // Validate input
    await this.validateUpdateUser(requestContext, user);

    if (user.userRole) {
      const userType = await this.toUserType(requestContext, user.userRole);

      user.isExternalUser = userType === 'EXTERNAL';
    }

    const dbService = await this.service('dbService');
    const table = this.settings.get(settingKeys.tableName);

    const by = _.get(requestContext, 'principalIdentifier.uid');

    const { uid } = user;
    const existingUser = await this.findUser({ uid });

    let result;
    if (!existingUser) {
      throw this.boom.notFound(`Cannot update user "${uid}". The user does not exist`, true);
    }

    // ensure that the caller has permissions to update the user
    // The following will result in checking permissions by calling the condition function "this.allowAuthorized" first
    await this.assertAuthorized(
      requestContext,
      { action: 'updateAttributes', conditions: [this.allowAuthorized] },
      user,
      existingUser,
    );

    // Validate the user attributes being updated
    await this.validateUpdateAttributes(requestContext, user, existingUser);

    // Run logic from any user management plugins
    const pluginRegistryService = await this.service('pluginRegistryService');
    const userUpdates = await pluginRegistryService.visitPlugins(
      'user-management',
      'updateUser',
      {
        payload: user,
      },
      { existingUser, container: this.container },
    );

    // Update DDB record
    // TODO: Implement plugin rollback on failure
    await runAndCatch(
      async () => {
        result = await dbService.helper
          .updater()
          .table(table)
          .key({ uid })
          .item(_.omit({ ...existingUser, ...userUpdates, updatedBy: by }, ['rev'])) // Remove 'rev' from the item. The "rev" method call below adds it correctly in update expression
          .rev(user.rev)
          .update();
      },
      async () => {
        throw this.boom.outdatedUpdateAttempt(
          `User "${uid}" was just updated before your request could be processed, please refresh and try again`,
          true,
        );
      },
    );

    // Write audit event
    await this.audit(requestContext, { action: 'update-user', body: result });

    return result;
  }

  async deleteUser(requestContext, { uid }) {
    const existingUser = await this.mustFindUser({ uid });

    // ensure that the caller has permissions to delete the user
    // The following will result in checking permissions by calling the condition function "this.allowAuthorized" first
    await this.assertAuthorized(requestContext, { action: 'delete', conditions: [this.allowAuthorized] }, existingUser);

    const dbService = await this.service('dbService');
    const table = this.settings.get(settingKeys.tableName);

    // Run logic from any user management plugins
    const pluginRegistryService = await this.service('pluginRegistryService');
    await pluginRegistryService.runPlugins('user-management', 'deleteUser', {
      container: this.container,
      user: existingUser,
    });

    // Delete user record from DDB
    await runAndCatch(
      async () => {
        return dbService.helper
          .deleter()
          .table(table)
          .condition('attribute_exists(uid)')
          .key('uid', uid)
          .delete();
      },
      async () => {
        throw this.boom.notFound(`The user "${uid}" does not exist`, true);
      },
    );

    // Write audit event
    await this.audit(requestContext, {
      action: 'delete-user',
      body: { uid, username: existingUser.username, ns: existingUser.ns },
    });

    return existingUser;
  }

  async ensureActiveUsers(users) {
    if (!Array.isArray(users)) {
      throw this.boom.badRequest(`invalid users type`, true);
    }

    if (_.isEmpty(users)) {
      return;
    }

    // ensure there are no duplicates
    const distinctUsers = new Set(users.map(u => u.uid));
    if (distinctUsers.size < users.length) {
      throw this.boom.badRequest('user list contains duplicates', true);
    }

    const findUserPromises = users.map(user => {
      const { uid } = user;
      return this.findUser({ uid });
    });

    const findUserResults = await Promise.all(findUserPromises);
    const findUserExistsStatus = findUserResults.map((user, index) => {
      return { usersIndex: index, exists: !!user };
    });
    const nonExistingUsers = findUserExistsStatus
      .filter(item => !item.exists)
      .map(item => users[item.usersIndex].username);

    if (nonExistingUsers.length) {
      throw this.boom.badRequest(`non available user: [${nonExistingUsers}]`, true);
    }
  }

  async findUser({ uid, fields = [] }) {
    const dbService = await this.service('dbService');
    const table = this.settings.get(settingKeys.tableName);
    return dbService.helper
      .getter()
      .table(table)
      .key({ uid })
      .projection(fields)
      .get();
  }

  async mustFindUser({ uid, fields = [] }) {
    const user = await this.findUser({ uid, fields });
    if (!user) throw this.boom.notFound(`The user id "${uid}" is not found`, true);
    return user;
  }

  async getUserByPrincipal({ username, ns, fields = [] }) {
    const dbService = await this.service('dbService');
    const table = this.settings.get(settingKeys.tableName);
    const users = await dbService.helper
      .query()
      .table(table)
      .index('Principal')
      .key('username', username)
      .sortKey('ns')
      .eq(ns)
      .projection(fields)
      .limit(1)
      .query();
    return users.length !== 0 ? users[0] : undefined;
  }

  async findUserByPrincipal({ username, authenticationProviderId, identityProviderName, fields = [] }) {
    const ns = toUserNamespace(authenticationProviderId, identityProviderName);
    return this.getUserByPrincipal({ username, ns, fields });
  }

  async mustFindUserByPrincipal({ username, authenticationProviderId, identityProviderName, fields = [] }) {
    const user = await this.findUserByPrincipal({
      username,
      authenticationProviderId,
      identityProviderName,
      fields,
    });
    if (!user) throw this.boom.notFound(`The user "${username}" is not found`, true);
    return user;
  }

  async existsByPrincipal({ username, authenticationProviderId, identityProviderName }) {
    const result = await this.findUserByPrincipal({
      username,
      authenticationProviderId,
      identityProviderName,
      fields: ['uid'],
    });
    return !!result;
  }

  async exists({ uid }) {
    const result = await this.findUser({ uid, fields: ['uid'] });
    return !!result;
  }

  async isCurrentUserActive(requestContext) {
    return this.isUserActive(requestContext.principal);
  }

  async isUserActive(user) {
    return user.status && user.status.toLowerCase() === 'active';
  }

  async listUsers(requestContext, { maxResults = 1000, nextToken, fields = [] } = {}) {
    const dbService = await this.service('dbService');
    const table = this.settings.get(settingKeys.tableName);

    const result = await dbService.helper
      .scanner()
      .table(table)
      .limit(maxResults)
      .projection(fields)
      .scanPage(nextToken);

    const isAdmin = _.get(requestContext, 'principal.isAdmin', false);
    const users = isAdmin ? result.items : result.items.map(user => _.omit(user, ['isAdmin']));
    const fieldsToOmit = isAdmin ? [] : ['userRole'];
    const sanitizedUsers = users.map(user => _.omit(user, fieldsToOmit));
    return { items: sanitizedUsers, nextToken: result.nextToken };
  }

  // Protected methods
  /**
   * Method to set default attributes to the given user object.
   * For example, if the user does not have "isAdmin" flag set, the method defaults it to "false" (i.e., create non-admin user, by default)
   *
   * @param requestContext
   * @param user
   * @returns {Promise<void>}
   */
  async setDefaultAttributes(requestContext, user) {
    const setDefaultIf = checkFn => {
      return (attribName, defaultValue) => {
        if (checkFn(user[attribName])) {
          user[attribName] = defaultValue;
        }
      };
    };
    const setDefaultIfNil = setDefaultIf(_.isNil);
    const setDefaultIfEmpty = setDefaultIf(_.isEmpty);

    // Set default values for "status", and "userRole" if they are not specified in the user
    if (user.isAdmin) {
      // default userRole to 'admin' if isAdmin flag is true
      setDefaultIfNil('userRole', 'admin');
    } else {
      // for all other users set "status" to "inactive" by default
      setDefaultIfNil('status', 'inactive');

      // for all other users set "userRole" to "guest" by default
      setDefaultIfNil('userRole', 'guest');
    }
    const { email, userRole } = user;
    const name = await this.toDefaultName(email);
    const userType = await this.toUserType(requestContext, userRole);

    setDefaultIfEmpty('username', email);
    setDefaultIfEmpty('firstName', name);
    setDefaultIfEmpty('lastName', name);
    setDefaultIfNil('isAdmin', false);
    setDefaultIfNil('status', 'active');

    user.isAdmin = userRole === 'admin';
    user.isExternalUser = userType === 'EXTERNAL';
  }

  /**
   * Validates the input for createUser api. The base version just does JSON schema validation using the schema
   * returned by the "getCreateUserJsonSchema" method. Subclasses, can override this method to perform any additional
   * validations.
   *
   * @param requestContext
   * @param input
   * @returns {Promise<void>}
   */
  async validateCreateUser(_requestContext, input) {
    const jsonSchemaValidationService = await this.service('jsonSchemaValidationService');
    const schema = await this.getCreateUserJsonSchema();
    await jsonSchemaValidationService.ensureValid(input, schema);
  }

  /**
   * Validates the input for updateUser api. The base version just does JSON schema validation using the schema
   * returned by the "getUpdateUserJsonSchema" method. Subclasses, can override this method to perform any additional
   * validations.
   *
   * @param requestContext
   * @param input
   * @returns {Promise<void>}
   */
  async validateUpdateUser(_requestContext, input) {
    const jsonSchemaValidationService = await this.service('jsonSchemaValidationService');
    const schema = await this.getUpdateUserJsonSchema();
    await jsonSchemaValidationService.ensureValid(input, schema);
  }

  // eslint-disable-next-line no-unused-vars
  async validateUpdateAttributes(_requestContext, _user, _existingUser) {
    // No-op at base level
  }

  async getCreateUserJsonSchema() {
    return createUserJsonSchema;
  }

  async getUpdateUserJsonSchema() {
    return updateUserJsonSchema;
  }

  async assertAuthorized(requestContext, { action, conditions }, ...args) {
    const authorizationService = await this.service('authorizationService');

    // The "authorizationService.assertAuthorized" below will evaluate permissions by calling the "conditions" functions first
    // It will then give a chance to all registered plugins (if any) to perform their authorization.
    // The plugins can even override the authorization decision returned by the conditions
    // See "authorizationService.authorize" method for more details
    await authorizationService.assertAuthorized(
      requestContext,
      { extensionPoint: 'user-authz', action, conditions },
      ...args,
    );
  }

  async selfServiceUpdateUser(requestContext, user = {}) {
    // user can only update his/her own info via self-service update
    const { username, authenticationProviderId, identityProviderName } = user;
    const ns = toUserNamespace(authenticationProviderId, identityProviderName);
    await ensureCurrentUser(requestContext, username, ns);

    return this.updateUser(requestContext, user);
  }

  async toUserType(requestContext, userRoleId) {
    const userRolesService = await this.service('userRolesService');
    let userType;
    if (userRoleId) {
      const { userType: userTypeInRole } = await userRolesService.mustFind(requestContext, { id: userRoleId });
      userType = userTypeInRole;
    }
    return userType;
  }

  async toDefaultName(userEmail) {
    return userEmail ? userEmail.substring(0, userEmail.lastIndexOf('@')) : '';
  }
}

export default UserService;
