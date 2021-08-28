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

// IMPORTANT
// The exported definition should be a pure json object, do not include functions or derived properties.
// This is because the definition is then serialized and stored as a string in the database.
export default {
  id: 'wt-empty',
  v: 1,
  title: 'Empty Workflow',
  desc: 'An empty workflow so that you have full control of the workflow.\n',
  hidden: false,
  builtin: true,
  propsOverrideOption: {
    // These are for the workflow template itself and not for the step templates
    allowed: ['title', 'desc', 'instanceTtl', 'steps', 'runSpecSize', 'runSpecTarget'],
  },
  instanceTtl: null, // Empty value means that it is indefinite
  selectedSteps: [],
};
