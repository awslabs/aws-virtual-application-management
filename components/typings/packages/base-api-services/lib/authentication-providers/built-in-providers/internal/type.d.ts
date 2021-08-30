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
        const credentialHandlingType: string;
        namespace inputSchema {
            export const definitions: {};
            export const $schema: string;
            export const $id: string;
            const type_1: string;
            export { type_1 as type };
            export const required: string[];
            export namespace properties {
                export namespace id {
                    const $id_1: string;
                    export { $id_1 as $id };
                    const type_2: string;
                    export { type_2 as type };
                }
                export namespace title_1 {
                    const $id_2: string;
                    export { $id_2 as $id };
                    const type_3: string;
                    export { type_3 as type };
                }
                export { title_1 as title };
                export namespace signInUri {
                    const $id_3: string;
                    export { $id_3 as $id };
                    const type_4: string;
                    export { type_4 as type };
                }
                export namespace signOutUri {
                    const $id_4: string;
                    export { $id_4 as $id };
                    const type_5: string;
                    export { type_5 as type };
                }
            }
        }
        namespace inputManifestForCreate {
            const sections: {
                title: string;
                children: {
                    name: string;
                    type: string;
                    title: string;
                    rules: string;
                    desc: string;
                }[];
            }[];
        }
        namespace inputManifestForUpdate {
            const sections_1: {
                title: string;
                children: {
                    name: string;
                    type: string;
                    title: string;
                    rules: string;
                    desc: string;
                }[];
            }[];
            export { sections_1 as sections };
        }
        namespace impl {
            const tokenIssuerLocator: string;
            const tokenValidatorLocator: string;
            const tokenRevokerLocator: string;
            const provisionerLocator: string;
        }
    }
}
export default _default;
