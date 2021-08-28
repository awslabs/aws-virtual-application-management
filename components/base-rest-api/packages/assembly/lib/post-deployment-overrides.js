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

import path from 'path';

import { getMergeJsonFilesTaskPlugin, getMergeCfnYmlsTaskPlugin } from '@aws-ee/base-assembly-tasks';

const overridesDir = path.normalize(path.join(__dirname, '../assets/overrides/post-deployment'));
const mergeJsonsPlugin = getMergeJsonFilesTaskPlugin(overridesDir);
const mergeYamlsPlugin = getMergeCfnYmlsTaskPlugin(overridesDir);

export default [mergeJsonsPlugin, mergeYamlsPlugin];
