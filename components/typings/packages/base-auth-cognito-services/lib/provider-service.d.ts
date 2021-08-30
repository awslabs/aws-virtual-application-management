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

export default CognitoProviderService;
declare class CognitoProviderService extends Service {
  cognitoTokenVerifiersCache: {};
  get providerType(): {
    type: string;
    title: string;
    description: string;
    config: {
      credentialHandlingType: string;
      inputSchema: any;
      inputManifestForCreate: {
        sections: (
          | {
              title: string;
              children: {
                name: string;
                type: string;
                title: string;
                rules: string;
                desc: string;
              }[];
              condition?: undefined;
            }
          | {
              title: string;
              children: {
                name: string;
                type: string;
                title: string;
                yesLabel: string;
                noLabel: string;
                rules: string;
                desc: string;
              }[];
              condition?: undefined;
            }
          | {
              title: string;
              condition: string;
              children: (
                | {
                    name: string;
                    type: string;
                    title: string;
                    rules: string;
                    desc: string;
                  }
                | {
                    name: string;
                    type: string;
                    title: string;
                    desc: string;
                    rules?: undefined;
                  }
              )[];
            }
        )[];
      };
      inputManifestForUpdate: {
        sections: (
          | {
              title: string;
              children: {
                name: string;
                type: string;
                title: string;
                rules: string;
                desc: string;
              }[];
            }
          | {
              title: string;
              children: {
                name: string;
                type: string;
                title: string;
                desc: string;
              }[];
            }
        )[];
      };
      impl: {
        tokenValidatorLocator: string;
        tokenRevokerLocator: string;
        provisionerLocator: string;
      };
    };
  };
  validateToken(
    {
      token,
      issuer,
    }: {
      token: string;
      issuer: string;
    },
    providerConfig: any,
  ): Promise<{
    verifiedtoken: string;
    username: string;
    identityProviderName: string;
    uid: string;
  }>;
  saveUser(userAttributes: any, authenticationProviderId: string): Promise<any>;
  /**
   * Creates a user in the system based on the user attributes provided by the SAML Identity Provider (IdP)
   * @param authenticationProviderId ID of the authentication provider
   * @param userAttributes An object containing attributes mapped from SAML IdP
   * @returns {Promise<void>}
   */
  createUser(authenticationProviderId: string, userAttributes: any): Promise<void>;
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
  updateUser(authenticationProviderId: string, userAttributes: any, existingUser: any): Promise<void>;
  revokeToken(
    requestContext: any,
    {
      token,
    }: {
      token: string;
    },
    providerConfig: any,
  ): Promise<void>;
}
import { Service } from '@aws-ee/base-services-container';
