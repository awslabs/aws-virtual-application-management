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
  id: 'no-op',
  v: 1,
  title: 'No Operation Step',
  desc:
    "This step is a no operation step. It's intended to be used either to show a dead end decision in your workflow\n" +
    'or so that you can check the logs at any point.\n',
  skippable: true, // this means that if there is an error in a previous step, then this step will be skipped
  hidden: false,
};
