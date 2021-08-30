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

import { ServicesContainer } from '@aws-ee/base-services-container';

export default plugin;
declare namespace plugin {
  export { createUser };
  export { updateUser };
  export { deleteUser };
}
/**
 * A function invoked whenever a user is created within the application so that the authentication provider
 * can perform steps such as creating a record of the user within its own directory or updating user attributes prior
 * to creation
 * @param {Object} userSoFar The raw user record as constructed so far
 * @param {Object} param1
 * @param {Object} param1.container An instance of ServicesContainer
 *
 * @returns The user that should be created within the application
 */
declare function createUser(
  userSoFar: any,
  {
    container,
  }: {
    container: ServicesContainer;
  },
): Promise<any>;
/**
 * A function invoked whenever a user is updated within the application so that the authentication provider
 * can perform steps such as updating its own record of the user or modify user attributes before they're updated in
 * the application
 * @param {Object} userUpdatesSoFar The raw user updates to be applied so far
 * @param {*} param1
 * @param {Object} param1.container An instance of ServicesContainer
 * @param {Object} param1.existingUser The associated user attributes that already exist within the application
 * @returns Updates that should be applied to the user record within the application
 */
declare function updateUser(
  userUpdatesSoFar: any,
  { container, existingUser }: { container: ServicesContainer; existingUser: any },
): Promise<any>;
/**
 * A function invoked whenever a user is deleted from the application so that the authentication provider
 * can perform steps such as deleting the user within its own directory
 * @param {Object} param0
 * @param {Object} param0.container An instance of ServicesContainer
 * @param {Object} param0.user The user's attributes as they exist within the application
 */
declare function deleteUser({ container, user }: { container: ServicesContainer; user: any }): Promise<void>;
