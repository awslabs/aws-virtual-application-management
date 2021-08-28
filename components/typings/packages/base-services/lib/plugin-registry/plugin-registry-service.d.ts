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

export default PluginRegistryService;
declare class PluginRegistryService {
    constructor(pluginRegistry?: {});
    pluginRegistry: {};
    init(): Promise<void>;
    getPlugins(extensionPoint: any): Promise<any>;
    getPluginsWithMethod(extensionPoint: any, methodName: any): Promise<any>;
    runPlugins(extensionPoint: any, methodName: any, ...args: any[]): Promise<any[]>;
    /**
     * A method to visit plugins that implement the specified method for the specified extension point. The specified
     * plugin method may be regular sync method or may be "async" i.e., it may return a Promise.
     * The method calls each plugin in the same order as registered in the plugin registry. If the plugin method
     * returns a Promise then next plugin is only invoked after the promise has settled (i.e., resolved or rejected).
     * It invokes the specified method on each plugin and passes a result returned by the previous plugin call.
     * This gives each plugin a chance to contribute to the payload. Each plugin can inspect the given payload and return
     * it "as is" or return a modified payload. The payload returned by the last plugin is considered the resultant payload
     * and returned to the caller.
     *
     * @param extensionPoint Name of the extension point in the plugin registry mapped to corresponding plugins
     *
     * @param methodName Name of the plugin method to call. The plugin method will be invoked with the payload as the
     * first argument followed by any other arguments specified by the "args". The plugin method may be regular sync
     * method or "async" method (i.e., it may return a Promise)
     *
     * @param options Various options for this call
     * @param options.payload Value of the initial payload to pass to the first plugin
     * @param options.continueOnError Optional flag indicating if the method should continue (i.e., continue calling the
     * next plugin) when a plugin throws error. Defaults to false.
     * @param options.pluginInvokerFn An optional plugin invoker function that invokes plugin. Default plugin invoker
     * calls the plugin method with the following arguments (payloadSoFar, ...args). The "payloadSoFar" is the payload
     * collected so far from previous plugins. The "...args" are any other arguments passed to this method. The
     * "pluginInvokerFn" can be used in cases where the plugin method signature does not match the "(payloadSoFar, ...args)"
     * signature. A custom implementation of "pluginInvokerFn" can be passed in such cases to customize the way the
     * plugin is called. The "pluginInvokerFn" is called with the following arguments "(pluginPayload, plugin, method, ...args)"
     *
     * @param args Any other arguments to pass to the plugins
     *
     * @returns {Promise<*>}
     */
    visitPlugins(extensionPoint: any, methodName: any, { payload, continueOnError, pluginInvokerFn, }?: {
        payload?: {};
        continueOnError?: boolean;
        pluginInvokerFn?: (pluginPayload: any, plugin: any, method: any, ...args: any[]) => Promise<any>;
    }, ...args: any[]): Promise<any>;
}
