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

module.exports = {
  title: 'Solution Documentation',
  url: 'https://override-me.com',
  baseUrl: '/',
  favicon: 'img/favicon.ico',
  organizationName: 'aws-ee',
  projectName: 'docs',
  themeConfig: {
    navbar: {
      title: 'Home',
      hideOnScroll: false,
      items: [
        {
          type: 'docsVersionDropdown',
          position: 'left',
        },
        {
          label: 'API',
          position: 'right',
          to: '/api',
        },
      ],
    },
  },
  presets: [
    [
      '@docusaurus/preset-classic',
      {
        docs: {
          routeBasePath: '/',
          // includeCurrentVersion: false,
          versions: {
            current: {
              label: 'Latest',
            },
          },
        },
      },
    ],
    [
      'redocusaurus',
      {
        specs: [
          {
            routePath: '/api/',
            spec: 'openapi.yaml',
          },
        ],
      },
    ],
  ],
  plugins: [require.resolve('./docusaurusWebpack5Plugin.js')],
};
