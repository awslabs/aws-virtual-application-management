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
import { applySnapshot, detach, getSnapshot, types } from 'mobx-state-tree';

import { addUser, getUsers, updateUser, deleteUser } from '../../helpers/api';
import { User } from './User';
import { BaseStore } from '../BaseStore';

const UsersStore = BaseStore.named('UsersStore')
  .props({
    users: types.optional(types.map(User), {}),
  })

  .actions(self => {
    // save the base implementation of cleanup
    const superCleanup = self.cleanup;

    return {
      async doLoad() {
        const usersResult = await getUsers();
        const users = _.get(usersResult, 'items') || [];
        self.runInAction(() => {
          const map = {};
          users.forEach(user => {
            const uid = user.uid;
            map[uid] = user;
          });
          self.users.replace(map);
        });
      },

      cleanup: () => {
        self.users.clear();
        superCleanup();
      },
      addUser: async user => {
        const addedUser = await addUser(user);
        self.runInAction(() => {
          // Added newly created user to users map
          const addedUserModel = User.create(addedUser);
          self.users.set(addedUserModel.id, addedUserModel);
        });
      },
      updateUser: async user => {
        const updatedUser = await updateUser(user);
        const userModel = User.create(updatedUser);
        const previousUser = self.users.get(userModel.id);
        applySnapshot(previousUser, updatedUser);
      },
      deleteUser: async user => {
        const uid = user && user.uid ? user.uid : User.create(user).uid;
        await deleteUser(user);
        const deletedUser = self.users.get(uid);
        self.runInAction(() => {
          // Detaching here instead of deleting because the ReactTable component in UsersList somehow still fires
          // "Cell" component rendering after the user is deleted from the map
          // That results in the following error
          // "You are trying to read or write to an object that is no longer part of a state tree. (Object type: 'User', Path upon death: "
          detach(deletedUser);
        });
      },
    };
  })

  .views(self => ({
    get empty() {
      return self.users.size === 0;
    },

    get list() {
      const result = [];
      // converting map self.users to result array
      self.users.forEach(user => result.push(user));
      return result;
    },

    asSelectOptions({ nonClearables = [] } = {}) {
      const result = [];
      self.users.forEach(user =>
        result.push({
          value: user.id,
          label: user.longDisplayName,
          clearableValue: !nonClearables.includes(user.id),
        }),
      );
      return result;
    },

    asDropDownOptions({ status = 'active' } = {}) {
      const result = [];
      self.users.forEach(user => {
        if (user.status === status) {
          result.push({
            key: user.id,
            value: user.id,
            text: user.longDisplayName,
          });
        }
      });
      return result;
    },

    asUserObject(userIdentifier) {
      if (userIdentifier) {
        const { uid, username, ns } = userIdentifier;
        const user = self.users.get(uid);
        return user || User.create({ username, ns });
      }
      return undefined;
    },

    asUserObjects(userIdentifiers = []) {
      const result = [];
      userIdentifiers.forEach(userIdentifier => {
        if (userIdentifier) {
          const user = self.users.get(userIdentifier.uid);
          if (user) {
            result.push(user);
          } else {
            result.push(User.create(getSnapshot(userIdentifier)));
          }
        }
      });

      return result;
    },
  }));

function toUserIds(userObjects) {
  return _.map(userObjects, user => user.id);
}

function toLongNames(userObjects) {
  return _.map(userObjects, user => user.longDisplayName);
}

function toLongName(object) {
  if (object) {
    return object.longDisplayName;
  }
  return 'Unknown';
}

function registerContextItems(appContext) {
  appContext.usersStore = UsersStore.create({}, appContext);
}

export { UsersStore, toUserIds, toLongNames, toLongName, registerContextItems };
