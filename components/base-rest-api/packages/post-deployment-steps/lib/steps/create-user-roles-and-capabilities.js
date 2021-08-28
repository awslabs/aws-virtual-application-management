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
import { getSystemRequestContext, UserRolesMap } from '@aws-ee/base-services';

const settingKeys = {
  autoSyncUserRoleCapabilities: 'autoSyncUserRoleCapabilities',
};
class CreateUserRolesAndCapabilitiesService extends Service {
  constructor() {
    super();
    this.dependency(['pluginRegistryService', 'userRolesService', 'userCapabilitiesService']);
  }

  async createUserRoles() {
    // Gather the base roles + all the roles contributed via the extension point
    const userRoleItems = await this.getAllRoles();
    const userCapabilityItems = await this.getAllCapabilities();

    await this.createAllRoles(userRoleItems, userCapabilityItems);
    await this.createAllCapabilities(userCapabilityItems);
  }

  async createAllRoles(userRoleItems, userCapabilityItems) {
    const [userRolesService] = await this.service(['userRolesService']);
    const requestContext = getSystemRequestContext();
    const autoSyncUserRoleCapabilities = this.settings.getBoolean(settingKeys.autoSyncUserRoleCapabilities);
    const creationPromises = userRoleItems.map(async role => {
      try {
        // check if the userRole already exists, do not create the item info
        const userRole = await userRolesService.find(requestContext, { id: role.id });

        // The admin user should have all capabilities defined in the solution
        if (role.id === UserRolesMap.ADMIN.id) {
          role.capabilities = _.concat(
            role.capabilities,
            userCapabilityItems.map(capabilityItem => {
              return capabilityItem.id;
            }),
          );
        }

        if (!userRole) {
          await userRolesService.create(requestContext, role);
          this.log.info({ message: `Created user role ${role.id}`, userRole: role });
        } else if (autoSyncUserRoleCapabilities) {
          // Update only capabilities as defined in code
          await userRolesService.update(requestContext, {
            ..._.pick(userRole, ['rev', 'userType']),
            ..._.pick(role, ['id', 'capabilities']),
          });
          this.log.info({ message: `Updated user role capabilities ${role.id}`, userRole: role });
        } else {
          this.log.info({ message: `User role already exists ${role.id}, auto sync disabled...`, userRole });
        }
      } catch (err) {
        if (err.code === 'alreadyExists') {
          // The user role already exists. Nothing to do.
          this.log.info(`The userRole ${role.id} already exists. Did NOT overwrite that userRole's information.`);
        } else {
          // In case of any other error let it bubble up
          throw err;
        }
      }
    });
    await Promise.all(creationPromises);

    // Make sure there are no disabled roles in db.
    // This can happen if the solution was deployed first with the roles enabled but then re-deployed after disabling
    // certain roles
    this.log.info(`Finished creating user roles`);
  }

  async createAllCapabilities(userCapabilityItems) {
    const [userCapabilitiesService] = await this.service(['userCapabilitiesService']);
    const requestContext = getSystemRequestContext();
    const creationPromises = userCapabilityItems.map(async capability => {
      try {
        // check if the user capability already exists, do not create or update the item info
        const userCapability = await userCapabilitiesService.find(requestContext, { id: capability.id });
        if (!userCapability) {
          await userCapabilitiesService.create(requestContext, capability);
          this.log.info({ message: `Created user capability ${capability.id}`, userCapability: capability });
        }
      } catch (err) {
        if (err.code === 'alreadyExists') {
          // The user role already exists. Nothing to do.
          this.log.info(
            `The user capability ${capability.id} already exists. Did NOT overwrite that capability's information.`,
          );
        } else {
          // In case of any other error let it bubble up
          throw err;
        }
      }
    });
    await Promise.all(creationPromises);

    this.log.info(`Finished creating user capabilities`);
  }

  /**
   * Visits all the users plugins and gathers all the roles defined in them and attaches the set capabilities.
   */
  async getAllRoles() {
    const [pluginRegistryService] = await this.service(['pluginRegistryService']);
    const roles = await pluginRegistryService.visitPlugins('users', 'getRoles', {
      payload: [...Object.values(UserRolesMap)],
      continueOnError: false,
    });

    const roleCapabilityMap = await pluginRegistryService.visitPlugins('users', 'setRoleCapabilities', {
      payload: {},
      continueOnError: false,
    });

    const rolesMap = {};
    roles.forEach(role => {
      if (_.isEmpty(rolesMap[role.id])) {
        rolesMap[role.id] = role;
      }

      // Combine role capabilities if defined multiple times
      rolesMap[role.id].capabilities = _.concat(rolesMap[role.id].capabilities, role.capabilities);

      // Add the roles capability set via plugins
      if (!_.isEmpty(roleCapabilityMap[role.id])) {
        rolesMap[role.id].capabilities = _.concat(rolesMap[role.id].capabilities, roleCapabilityMap[role.id]);
      }

      // De-duplicate capabilities
      rolesMap[role.id].capabilities = _.uniqWith(rolesMap[role.id].capabilities, _.isEqual);
    });

    return Object.values(rolesMap);
  }

  /**
   * Visits all the users plugins and gathers all the capabilities defined in them.
   */
  async getAllCapabilities() {
    const [pluginRegistryService] = await this.service(['pluginRegistryService']);
    const capabilities = await pluginRegistryService.visitPlugins('users', 'getCapabilities', {
      payload: [],
      continueOnError: false,
    });

    return capabilities;
  }

  async deleteRoles(requestContext, roles) {
    const [userRolesService] = await this.service(['userRolesService']);
    const deletionPromises = roles.map(async role => {
      try {
        await userRolesService.delete(requestContext, { id: role.id });
      } catch (err) {
        // The user role does not exist. Nothing to delete in that case
        if (err.code !== 'notFound') {
          // In case of any other error let it bubble up
          throw err;
        }
      }
    });
    return Promise.all(deletionPromises);
  }

  async execute() {
    return this.createUserRoles();
  }
}

export default CreateUserRolesAndCapabilitiesService;
