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

export default factory;
/**
 * A utility authorization plugin factory that creates an authorization plugin that delegates authorization to the
 * specified service. The plugin returned by this factory can be registered with the plugin registry for the "*-authz"
 * extension points.
 * The authorization-service invokes these plugins in the same order as they are registered in the plugin registry.
 * Each plugin instance gets a chance to perform authorization.
 * -- Each plugin is passed a plain JavaScript object containing the authorization result evaluated so far from other plugins.
 * -- Each plugin gets a chance to inspect the authorization result (i.e., effect) from previous plugins and return its own authorization effect as "allow" or "deny".
 * -- The authorization result with effect returned from the last plugin will be used as an effective authorization answer.
 *
 * The plugin returned by this factory delegates authorization to the authorization service specified by the
 * "authorizationServiceName" argument. The plugin looks up the service using the specified "authorizationServiceName"
 * from the services container.
 *
 * @param authorizationServiceName Name of the authorization service in the services container to delegate to.
 * If a non-existent authorizationServiceName specified then the plugin skips calling the service and returns the
 * permissions passed to it as is.
 *
 * @returns {{authorize: authorize}}
 */
declare function factory(authorizationServiceName: any): {
    authorize: any;
};
