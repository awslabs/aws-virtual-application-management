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

export default ProviderService;
declare class ProviderService {
    cognitoTokenVerifiersCache: {};
    validateToken({ token, issuer }: {
        token: any;
        issuer: any;
    }, providerConfig: any): Promise<{
        verifiedToken: any;
        username: any;
        uid: any;
        identityProviderName: any;
    }>;
    saveUser(decodedToken: any, authenticationProviderId: any): Promise<any>;
    /**
     * Creates a user in the system based on the user attributes provided by the SAML Identity Provider (IdP)
     * @param authenticationProviderId ID of the authentication provider
     * @param userAttributes An object containing attributes mapped from SAML IdP
     * @returns {Promise<void>}
     */
    createUser(authenticationProviderId: any, userAttributes: any): Promise<void>;
    /**
     * Updates user in the system based on the user attributes provided by the SAML Identity Provider (IdP).
     * This base implementation updates only those user attributes in the system which are missing but are available in
     * the SAML user attributes. Subclasses can override this method to provide different implementation (for example,
     * update all user attributes in the system if they are updated in SAML IdP etc)
     *
     * @param authenticationProviderId ID of the authentication provider
     * @param userAttributes An object containing attributes mapped from SAML IdP
     * @param existingUser The existing user in the system
     *
     * @returns {Promise<void>}
     */
    updateUser(authenticationProviderId: any, userAttributes: any, existingUser: any): Promise<void>;
    revokeToken(requestContext: any, { token }: {
        token: any;
    }, providerConfig: any): Promise<void>;
}
