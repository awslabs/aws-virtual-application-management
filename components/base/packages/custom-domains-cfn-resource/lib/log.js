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

const logLevelMap = {
  ERROR: 0,
  INFO: 4,
  DEBUG: 8,
};

// const logLevelOverall = logLevelMap.ERROR;
const logLevelOverall = logLevelMap.INFO;
// const logLevelOverall = logLevelMap.DEBUG;

function log(message, level) {
  const logLevel = logLevelMap[level];
  // eslint-disable-next-line no-console
  if (logLevel <= logLevelOverall) console.log(`${level}: ${message}`);
}

function logError(message) {
  log(message, 'ERROR');
}

function logInfo(message) {
  log(message, 'INFO');
}

function logDebug(message) {
  log(message, 'DEBUG');
}

export { logError, logInfo, logDebug };
