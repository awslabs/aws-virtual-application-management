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

/**
 * Returns namespace for identifying users. A user with the same username may be authenticated by different authentication
 * providers. An authentication provider itself may federate user across multiple identity providers.
 * For example, a given Cognito User Pool can act as an authentication provider and the given user pool itself may
 * federate users from multiple identity providers (such as multiple SAML IdPs or social IdPs such as google, facebook etc).
 * To uniquely identify a user we need 2 things the username and username's namespace. A username has to be unique
 * within a given namespace. The namespace itself is a composite of authenticationProviderId (for example, cognito
 * user pool uri) and optionally identityProviderName.
 *
 * @param authenticationProviderId
 * @param identityProviderName
 * @returns {string|*}
 */
export function toUserNamespace(authenticationProviderId: any, identityProviderName: any): string | any;
/**
 * This is the inverse of the "toUserNamespace" function.
 * It returns the "authenticationProviderId" and "identityProviderName" based on the given user namespace.
 *
 * @param userNamespace
 * @returns {{authenticationProviderId: *, identityProviderName: *}}
 */
export function fromUserNamespace(userNamespace: any): {
    authenticationProviderId: any;
    identityProviderName: any;
};
