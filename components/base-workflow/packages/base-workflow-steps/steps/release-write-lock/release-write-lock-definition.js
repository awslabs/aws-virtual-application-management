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
  id: 'st-release-write-lock',
  v: 1,
  title: 'Release Write Lock',
  desc: 'This step releases a write lock given the write lock token.\n',
  skippable: false, // this is important, leave it as false so that this step is called even if pervious steps had errors
  hidden: false,
  inputManifest: {
    sections: [
      {
        title: 'Configuration',
        children: [
          {
            name: 'writeTokenKeyName',
            type: 'stringInput',
            title: 'Payload key name for the write token value',
            rules: 'required',
            default: 'writeLockToken',
            desc: 'This is the key name to use obtain the value of the write lock token from the payload.\n',
          },
        ],
      },
    ],
  },
};
