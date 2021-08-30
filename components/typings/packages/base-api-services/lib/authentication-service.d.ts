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

export default AuthenticationService;
declare class AuthenticationService {
    init(): Promise<void>;
    invoke: (locator: any, ...args: any[]) => Promise<any>;
    pluginRegistryService: any;
    /**
     * type AuthenticationResult = AuthenticationSuccess | AuthenticationFailed;
     * type AuthenticationSuccess = {
     *   authenticated: true
     *   verifiedToken: Object
     *   uid: string
     *   username: string
     *   authenticationProviderId: string
     *   identityProviderName?: string
     * }
     * type AuthenticationError = {
     *   authenticated: false
     *   error: Error | string
     *   uid?: string
     *   username?: string
     *   authenticationProviderId?: string
     *   identityProviderName?: string
     * }
     *
     * @returns AuthenticationResult
     */
    authenticateMain(token: any): Promise<any>;
    authenticate(token: any): Promise<any>;
    checkUserRoles(_token: any, authResult: any): Promise<any>;
    checkWithPlugins(token: any, authResult: any): Promise<any>;
}
