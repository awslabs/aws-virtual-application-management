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

export default UserService;
declare class UserService {
    init(): Promise<void>;
    allowAuthorized: (requestContext: any, { resource, action, effect, reason }: {
        resource: any;
        action: any;
        effect: any;
        reason: any;
    }, ...args: any[]) => any;
    createUser(requestContext: any, user: any): Promise<any>;
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
    createUsers(requestContext: any, users: any, defaultAuthNProviderId: any, batchSize?: number): Promise<any[]>;
    updateUser(requestContext: any, user: any): Promise<any>;
    deleteUser(requestContext: any, { uid }: {
        uid: any;
    }): Promise<any>;
    ensureActiveUsers(users: any): Promise<void>;
    findUser({ uid, fields }: {
        uid: any;
        fields?: any[];
    }): Promise<any>;
    mustFindUser({ uid, fields }: {
        uid: any;
        fields?: any[];
    }): Promise<any>;
    getUserByPrincipal({ username, ns, fields }: {
        username: any;
        ns: any;
        fields?: any[];
    }): Promise<any>;
    findUserByPrincipal({ username, authenticationProviderId, identityProviderName, fields }: {
        username: any;
        authenticationProviderId: any;
        identityProviderName: any;
        fields?: any[];
    }): Promise<any>;
    mustFindUserByPrincipal({ username, authenticationProviderId, identityProviderName, fields }: {
        username: any;
        authenticationProviderId: any;
        identityProviderName: any;
        fields?: any[];
    }): Promise<any>;
    existsByPrincipal({ username, authenticationProviderId, identityProviderName }: {
        username: any;
        authenticationProviderId: any;
        identityProviderName: any;
    }): Promise<boolean>;
    exists({ uid }: {
        uid: any;
    }): Promise<boolean>;
    isCurrentUserActive(requestContext: any): Promise<boolean>;
    isUserActive(user: any): Promise<boolean>;
    listUsers(requestContext: any, { maxResults, nextToken, fields }?: {
        maxResults?: number;
        nextToken: any;
        fields?: any[];
    }): Promise<{
        items: any;
        nextToken: any;
    }>;
    /**
     * Method to set default attributes to the given user object.
     * For example, if the user does not have "isAdmin" flag set, the method defaults it to "false" (i.e., create non-admin user, by default)
     *
     * @param requestContext
     * @param user
     * @returns {Promise<void>}
     */
    setDefaultAttributes(requestContext: any, user: any): Promise<void>;
    /**
     * Validates the input for createUser api. The base version just does JSON schema validation using the schema
     * returned by the "getCreateUserJsonSchema" method. Subclasses, can override this method to perform any additional
     * validations.
     *
     * @param requestContext
     * @param input
     * @returns {Promise<void>}
     */
    validateCreateUser(_requestContext: any, input: any): Promise<void>;
    /**
     * Validates the input for updateUser api. The base version just does JSON schema validation using the schema
     * returned by the "getUpdateUserJsonSchema" method. Subclasses, can override this method to perform any additional
     * validations.
     *
     * @param requestContext
     * @param input
     * @returns {Promise<void>}
     */
    validateUpdateUser(_requestContext: any, input: any): Promise<void>;
    validateUpdateAttributes(_requestContext: any, _user: any, _existingUser: any): Promise<void>;
    getCreateUserJsonSchema(): Promise<any>;
    getUpdateUserJsonSchema(): Promise<any>;
    assertAuthorized(requestContext: any, { action, conditions }: {
        action: any;
        conditions: any;
    }, ...args: any[]): Promise<void>;
    selfServiceUpdateUser(requestContext: any, user?: {}): Promise<any>;
    toUserType(requestContext: any, userRoleId: any): Promise<any>;
    toDefaultName(userEmail: any): Promise<any>;
}
