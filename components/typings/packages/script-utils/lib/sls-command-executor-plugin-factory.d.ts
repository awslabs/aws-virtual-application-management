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
 * A factory that returns a plugin object containing a plugin method with the given "pluginMethodName".
 * The returned plugin implementation just invokes the given "subcommand" as "pnpx sls <subcommand>", when the plugin is invoked.
 * The plugin returned by this factory is expected to be invoked in the context of Serverless Framework Plugin during build time.
 *
 * @param slsProjDir Path to the Serverless Framework Project directory i.e., a directory containing "serverless.yml" file.
 * @param pluginMethodName Plugin method name that should be implemented by the returned plugin
 * @param subCommand The sls subcommand to be executed by the Serverless Framework CLI
 * @param commandArgs Any additional command arguments to be passed to the sls command.
 * @param stdio
 * @param stdout
 *
 * @returns {{[pluginMethodName]: (function(*, *): Promise<*>)}} A plugin object containing the plugin method with the given pluginMethodName.
 */
export function getSlsCommandPlugin(slsProjDir: any, pluginMethodName: any, subCommand: any, commandArgs: any[], stdio: string, stdout: any): {
    [pluginMethodName]: ((arg0: any, arg1: any) => Promise<any>);
};
export function getSlsPackagePlugin(slsProjDir: any): {};
export function getSlsDeployPlugin(slsProjDir: any): {};
export function getSlsRemovePlugin(slsProjDir: any): {};
export function getSlsPrintPlugin(slsProjDir: any, format?: string, serverlessPath?: string): {};
export function getSlsDisableStatsPlugin(slsProjDir: any): {
    disableStats: (...args: any[]) => Promise<any>;
};
