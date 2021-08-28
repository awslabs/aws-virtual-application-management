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

export default plugin;
declare namespace plugin {
    export { getStaticSettings };
    export { registerServices };
}
/**
 * Registers static settings provided by this add-on.
 *
 * @param existingStaticSettings An existing static settings plain javascript object containing settings as key/value contributed by other plugins.
 * @param settings Default instance of settings service that resolves settings from environment variables.
 * @param pluginRegistry A registry that provides plugins registered by various addons for the specified extension point.
 *
 * @returns {Promise<*>} A promise that resolves to static settings object
 */
declare function getStaticSettings(existingStaticSettings: any, settings: any, _pluginRegistry: any): Promise<any>;
/**
 * Registers the services provided by this add-on.
 *
 * @param container An instance of ServicesContainer to register services to.
 * @param pluginRegistry A registry that provides plugins registered by various addons for the specified extension point.
 *
 * @returns {Promise<void>}
 */
declare function registerServices(container: any, _pluginRegistry: any): Promise<void>;
