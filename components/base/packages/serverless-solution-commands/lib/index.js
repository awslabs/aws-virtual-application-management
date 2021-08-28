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

import ServerlessSolutionCommandsPlugin from './serverless-solution-commands-plugin';
import { getCommandLogger } from './command-logger';

export * as ServerlessSolutionCommands from './serverless-solution-commands';
export default ServerlessSolutionCommandsPlugin;

const ServerlessSolutionCommandsClass = require('./serverless-solution-commands');

export * from './command-logger';

// Compatibility with SLS
module.exports = exports.default;
module.exports.ServerlessSolutionCommands = ServerlessSolutionCommandsClass;
module.exports.getCommandLogger = getCommandLogger;
