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
 * Utility function to register services by calling each service registration plugin in order.
 * @param {*} container An instance of ServicesContainer
 * @param {{getPlugins: (function(*): *)}} pluginRegistry A registry that provides plugins registered by various components for the specified extension point.
 * Each 'service' plugin in the returned array is an object containing "registerServices" method.
 *
 * @returns {Promise<void>}
 */
export function registerServices(container: any, pluginRegistry: {
    getPlugins: ((arg0: any) => any);
}): Promise<void>;
