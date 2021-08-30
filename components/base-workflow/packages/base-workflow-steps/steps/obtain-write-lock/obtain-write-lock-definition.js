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
  id: 'st-obtain-write-lock',
  v: 1,
  title: 'Obtain Write Lock',
  desc:
    'This step attempts to obtain a lock given a lock id. You can configure its behavior via its config keys, such\n' +
    'as how many attempts should be tried and the time between each attempt.\n',
  skippable: true, // this means that if there is an error in a previous step, then this step will be skipped
  hidden: false,
  inputManifest: {
    sections: [
      {
        title: 'Configuration',
        children: [
          {
            name: 'lockIdKeyName',
            type: 'stringInput',
            title: 'Payload key name',
            rules: 'required',
            desc: 'This is the key name to use when looking up the lock id from the payload\n',
          },
          {
            name: 'attemptsCount',
            type: 'stringInput',
            title: 'Attempts count',
            rules: 'required|integer',
            default: 10,
            desc:
              'How many times should this step attempt to obtain the lock? (if the previous attempt did not obtain the lock)\n',
          },
          {
            name: 'waitPeriod',
            type: 'stringInput',
            title: 'Wait time',
            rules: 'required|integer',
            default: 1,
            desc:
              'The time (in seconds) to wait before attempting again to obtain the lock (if the previous attempt did not obtain the lock)\n',
          },
          {
            name: 'expiresIn',
            type: 'stringInput',
            title: 'Expires after',
            rules: 'required|integer',
            default: 7200,
            desc:
              'The time (in seconds) before a write lock expires. Make sure you provide a value with enough buffer for your operation.\n' +
              'For example, if you are expecting your steps to take 1 second to finish, then set the lock expiry value to 7200 (2 hours) or larger.\n' +
              'Remember that this expiry mechanism is meant to address edge cases, where your "Release Lock" step fails for some reason.\n',
          },
          {
            name: 'writeTokenKeyName',
            type: 'stringInput',
            title: 'Payload key name for the write token value',
            rules: 'required',
            default: 'writeLockToken',
            desc: 'This is the key name to use when populating the payload with the obtained write lock token.\n',
          },
        ],
      },
    ],
  },
};
