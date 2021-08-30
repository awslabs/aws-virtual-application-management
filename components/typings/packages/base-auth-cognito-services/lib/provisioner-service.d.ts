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

export default CognitoProvisionerService;
declare class CognitoProvisionerService extends Service {
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
  provision({
    providerTypeConfig,
    providerConfig,
    action,
  }: {
    providerTypeConfig: any;
    providerConfig: any;
    action: authenticationProviders.provisioningAction;
  }): Promise<any>;
  updateUserPoolClient(providerConfig: any): Promise<void>;
  configureCognitoIdentityProviders(providerConfig: any): Promise<void>;
}
import { Service } from '@aws-ee/base-services-container';
import { authenticationProviders } from '@aws-ee/base-api-services';
