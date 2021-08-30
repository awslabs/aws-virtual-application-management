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
  'Deployment Guide': {
    idx: 1000,
    vals: {
      'deployment/summary': { idx: 1000 },
      'deployment/quick_install': { idx: 2000 },
      'Pre Deployment': {
        idx: 3000,
        vals: {
          'deployment/pre_deployment/deployment_instance': { idx: 1000 },
          'deployment/pre_deployment/prereq_commands': { idx: 2000 },
          'deployment/pre_deployment/source_code': { idx: 3000 },
          'deployment/pre_deployment/configuration': { idx: 4000 },
        },
      },
      'deployment/deployment/index': { idx: 4000 },
      'Post Deployment': {
        idx: 5000,
        vals: {
          'deployment/post_deployment/index': { idx: 1000 },
          'deployment/post_deployment/create_admin_user': { idx: 2000 },
        },
      },
      'deployment/redeployment': { idx: 6000 },
      'Reference': {
        idx: 8000,
        vals: {
          'deployment/reference/iam_role': { idx: 1000 },
        },
      },
    },
  },
  'Best Practices': {
    idx: 3000,
    vals: {
      'best_practices/introduction': { idx: 1000 },
      'best_practices/multiple_deployment_environments': { idx: 2000 },
      'best_practices/aws_cloudtrail': { idx: 3000 },
      'best_practices/aws_shield': { idx: 4000 },
      'best_practices/cicd': { idx: 5000 },
      'best_practices/rotating_jwt_token': { idx: 6000 },
    },
  },
  'Development Guide': {
    idx: 4000,
    vals: {
      'development/introduction': { idx: 1000 },
      'development/component-architecture': { idx: 2000 },
      'development/settings': { idx: 3000 },
      'development/solution-assembly': { idx: 4000 },
      'Building your first Component': {
        idx: 5000,
        vals: {
          'development/building-your-first-component/introduction': { idx: 1000 },
          'development/building-your-first-component/create-services': { idx: 2000 },
          'development/building-your-first-component/create-rest-apis': { idx: 3000 },
          'development/building-your-first-component/create-assembly-package': { idx: 4000 },
          'development/building-your-first-component/integrate-component-to-project': { idx: 5000 },
          'development/building-your-first-component/test-component-apis': { idx: 6000 },
        },
      },
      'development/openapi': { idx: 6000 },
      'development/local-development': { idx: 7000 },
      'development/docs-plugin': { idx: 8000 },
    },
  },
};
