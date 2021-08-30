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
 * A factory that returns a plugin object containing a plugin method with the given "pluginMethodName".
 * The returned plugin implementation just invokes the given "command" when the plugin is invoked.
 * The plugin returned by this factory is expected to be invoked in the context of Serverless Framework Plugin during build time.
 *
 * @param pluginMethodName Plugin method name that should be implemented by the returned plugin
 * @param command A shell command to executed upon plugin invocation
 * @param args The shell command arguments
 * @param successCodes The command exit codes to be treated as success codes. Defaults to [0].
 * @param cwd The working directory from where the shell command should be executed from.
 * @param env The shell environment variables to pass to the command
 * @param stdio Mode used to configure the pipes that are established between the parent and child process.
 *              Defaults to "inherit" i.e., the child process inherits the stdin, stdout, and stderr streams of the parent process.
 *
 * @returns {{[pluginMethodName]: (function(*, *): Promise<*>)}} A plugin object containing the plugin method with the given pluginMethodName.
 */
declare function factory({ pluginMethodName, command, args, successCodes, cwd, env, stdio, stdout }: {
    pluginMethodName: any;
    command: any;
    args: any;
    successCodes?: number[];
    cwd: any;
    env: any;
    stdio?: string;
    stdout: any;
}): {
    [pluginMethodName]: ((arg0: any, arg1: any) => Promise<any>);
};
