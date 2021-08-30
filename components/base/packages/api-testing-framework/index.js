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

const { bootstrap } = require('./lib/bootstrap');
const { runSetup } = require('./lib/setup/setup');
const { ResourceNode } = require('./lib/resources/resource');
const { CollectionResourceNode } = require('./lib/resources/collection-resource');
const { getIdToken } = require('./lib/setup/id-token');
const { getProjectConfigs } = require('./lib/setup/project-config');
const utils = require('./lib/helpers/utils');
const errorCode = require('./lib/setup/error-code');
const maliciousData = require('./lib/data/malicious');
const string = require('./lib/helpers/string');
const { getCallerAccountId } = require('./lib/aws/caller-account-id');

module.exports = {
  bootstrap,
  runSetup,
  ResourceNode,
  CollectionResourceNode,
  getIdToken,
  utils,
  errorCode,
  getProjectConfigs,
  maliciousData,
  string,
  getCallerAccountId,
};
