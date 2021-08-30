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

export function mergeYamls({ from, to, ignorePatterns, mergeFn, parser, slsPlugin, }: {
    from: any;
    to: any;
    ignorePatterns?: string[];
    mergeFn?: any;
    parser?: {
        unmarshal: (yamlStr: any, options?: {}) => Promise<any>;
        marshal: (obj: any, options?: {}) => Promise<any>;
    };
    slsPlugin: any;
}): Promise<() => Promise<void>>;
