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

// See https://v2.docusaurus.io/docs/next/docs-introduction/#sidebar
module.exports = {
  'Deployment Guide': {
    vals: {
      'deployment/quick_install': {},
      'deployment/redeployment': {},
    },
  },
  'User Guide': {
    vals: {
      'user_guide/application_repo': {},
      'user_guide/introduction': {},
      // eslint-disable-next-line prettier/prettier
      Sidebar: {
        vals: {
          'User View': {
            vals: {
              'Dashboard': {
                vals: {
                  'user_guide/sidebar/common/dashboard/introduction': {},
                },
              },
              'Applications': {
                vals: {
                  'user_guide/sidebar/common/applications/introduction': {},
                },
              },
              'Appstream Images': {
                vals: {
                  'user_guide/sidebar/common/images/introduction': {},
                  'user_guide/sidebar/common/images/create-image': {},
                  'user_guide/sidebar/common/images/image-details': {},
                  'user_guide/sidebar/common/images/delete-image': {},
                },
              },
              'Fleets': {
                vals: {
                  'user_guide/sidebar/common/fleets/introduction': {},
                  'user_guide/sidebar/common/fleets/create-fleet': {},
                  'user_guide/sidebar/common/fleets/fleet-details': {},
                },
              },
              'Dynamic Catalogs': {
                vals: {
                  'user_guide/sidebar/common/dynamic-catalogs/introduction': {},
                  'user_guide/sidebar/common/dynamic-catalogs/create-dynamic-catalog': {},
                  'user_guide/sidebar/common/dynamic-catalogs/dynamic-catalog-details': {},
                },
              },
            },
          },
          'Administrator View': {
            vals: {
              'Dashboard': {
                vals: {
                  'user_guide/sidebar/common/dashboard/introduction': {},
                },
              },
              'Applications': {
                vals: {
                  'user_guide/sidebar/common/applications/introduction': {},
                },
              },
              'Appstream Images': {
                vals: {
                  'user_guide/sidebar/common/images/introduction': {},
                  'user_guide/sidebar/common/images/create-image': {},
                  'user_guide/sidebar/common/images/image-details': {},
                  'user_guide/sidebar/common/images/delete-image': {},
                },
              },
              'Fleets': {
                vals: {
                  'user_guide/sidebar/common/fleets/introduction': {},
                  'user_guide/sidebar/common/fleets/create-fleet': {},
                  'user_guide/sidebar/common/fleets/fleet-details': {},
                },
              },
              'Dynamic Catalogs': {
                vals: {
                  'user_guide/sidebar/common/dynamic-catalogs/introduction': {},
                  'user_guide/sidebar/common/dynamic-catalogs/create-dynamic-catalog': {},
                  'user_guide/sidebar/common/dynamic-catalogs/dynamic-catalog-details': {},
                },
              },
            },
          },
        },
      },
    },
  },
  'Best Practices': {
    vals: {
      'best_practices/introduction': {},
      'best_practices/multiple_deployment_environments': {},
      'best_practices/amazon_inspector': {},
      'best_practices/aws_cloudtrail': {},
      'best_practices/aws_shield': {},
      'best_practices/rotating_jwt_token': {},
    },
  },
  'Development Guide': {
    vals: { 'development/introduction': {} },
  },
};
