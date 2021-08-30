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

declare namespace _default {
    const type: string;
    const title: string;
    const description: string;
    namespace config {
        export const credentialHandlingType: string;
        export { inputSchema };
        export { inputManifestForCreate };
        export { inputManifestForUpdate };
        export namespace impl {
            const tokenValidatorLocator: string;
            const tokenRevokerLocator: string;
            const provisionerLocator: string;
        }
    }
}
export default _default;
import { inputManifestForCreate } from "./create-cognito-user-pool-input-manifest";
import { inputManifestForUpdate } from "./update-cognito-user-pool-input-manifest";
