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

/* eslint-disable */
// See https://v2.docusaurus.io/docs/next/docs-introduction/#sidebar
module.exports = {
  'User Guide': {
    idx: 2000,
    vals: {
      'user_guide/introduction': { idx: 1000 },
      'Sidebar': {
        idx: 2000,
        vals: {
          'User View': {
            idx: 2000,
            vals: {
              'user_guide/sidebar/common/dashboard/introduction': { idx: 1000 },
            },
          },
          'Administrator View': {
            idx: 1000,
            vals: {
              'user_guide/sidebar/common/dashboard/introduction': { idx: 1000 },
              'user_guide/sidebar/admin/auth/introduction': { idx: 2000 },
              'user_guide/sidebar/admin/users/introduction': { idx: 3000 },
              // 'user_guide/sidebar/admin/api_keys/introduction': { idx: 4000 },
            },
          },
        },
      },
    },
  },
};
