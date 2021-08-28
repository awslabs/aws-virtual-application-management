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

import { RequestContext, Service } from "@aws-ee/base-services-container";
import { AuthorizationOptions } from "./authorization-result";

export default AuthorizationService;
/**
 * Main authorization service implementation that performs authorization for the specified "action" by calling all the
 * available plugins from various add-ons for the specified authorization extension point. These plugins are expected to
 * implement "authorize" method.
 */
declare class AuthorizationService extends Service {
    /**
     * Main authorization method responsible for authorizing the specified action.
     *
     * @param requestContext The request context object containing principal (caller) information.
     * The principal's identifier object is expected to be available as "requestContext.principalIdentifier" and the
     * principal object is expected to be available as "requestContext.principal"
     *
     * @param extensionPoint Name of authorization extension point specific to the resource for which the authorization
     * needs to be performed. The method invokes all plugins registered to the specified extension point giving them a
     * chance to perform their authorization logic.
     * -- The plugins are called in the same order as returned by the registry.
     * -- Each plugin is passed a plain JavaScript object containing the authorization result evaluated so far from previous plugins.
     * -- Each plugin gets a chance to inspect the authorization result collected so far and return authorization effect as
     * "allow" or "deny". i.e., each subsequent plugin has a chance to loosen or tighten the permissions returned by previous
     * plugins.
     * -- The authorization result with effect returned from the last plugin will be used as an effective authorization answer.
     * These plugins are expected to implement "authorize" method. The method may be sync or async (i.e., it may return a promise).
     * If it returns promise, it is awaited before calling the next plugin.
     *
     * @param resource The resource for which the authorization needs to be performed (Optional).
     *
     * @param action The action for which the authorization needs to be performed
     *
     * @param conditions Optional condition function or an array of functions. All conditions are assumed to be connected
     * by AND i.e., all condition functions must return "allow" for the action to be authorized. These functions are
     * invoked with the same arguments that the authorizer plugin is invoked with. i.e.,
     * "(requestContext, container, permissionsSoFar, ...args)".
     * The "permissionsSoFar" is permissions returned by the previous function in the array. It is an object with the
     * shape {resource, action, effect, reason}. These condition functions can be sync or async
     * (i.e., they can return a Promise). If the function returns a promise, it is awaited first before calling the next
     * function in the array. (i.e., the next function is not invoked until the returned promise either resolves or rejects).
     * The effective permissions as a result of evaluating all conditions (with implicit AND between them) is passed to
     * the plugins registered against the specified "extension-point". These plugins can inspect these permissions and
     * return permission as is or change it. In other words, the plugins can override permissions resulted by evaluating
     * the conditions. This allows the plugins to loosen/tighten permissions as per their requirements.
     *
     * @param args Additional arguments to pass to the plugins for the specified extension point. These arguments are also
     * passed to the condition functions.
     *
     * @returns {Promise<{reason, effect: string}>} A promise that resolves to effective permissions for the specified
     * action and principal (the principal information is retrieved from requestContext)
     */
    authorize(requestContext: any, { extensionPoint, resource, action, conditions }: {
        extensionPoint: any;
        resource: any;
        action: any;
        conditions: any;
    }, ...args: any[]): Promise<{
        reason;
        effect: string;
    }>;
    /**
     * A method similar to the {@link authorize} method except that this method throws forbidden exception if the
     * authorization results in "deny".
     *
     * @param requestContext
     * @param extensionPoint
     * @param resource
     * @param action
     * @param conditions
     * @param args
     * @returns {Promise<void>}
     *
     * @see authorize
     */
    assertAuthorized(requestContext: RequestContext, options: AuthorizationOptions, ...args: unknown[]): Promise<void>;
    toAuthorizerPlugins(conditionFns: any): Promise<any>;
}
