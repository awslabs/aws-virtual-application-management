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

import { renderAppContainer, renderError, renderProgress, bootstrapApp } from '@aws-ee/base-ui';
import pluginRegistry from '@aws-ee/main-registry-ui';
import '@aws-ee/main-ui/dist/css';
import 'typeface-lato';
import './css/basscss-important.css';
import './css/semantic.min.css';
import 'animate.css/animate.css';
import 'toastr/build/toastr.css';
import 'react-table/react-table.css';
import './css/index.css';

const requireTranslationsIfExists = () => {
  try {
    // eslint-disable-next-line import/no-dynamic-require, import/no-unresolved, global-require
    return require('./i18n/translations.json');
    // eslint-disable-next-line no-empty
  } catch (err) {}
  return {};
};

bootstrapApp({
  renderAppContainer,
  renderError,
  renderProgress,
  pluginRegistry,
  translations: requireTranslationsIfExists(),
});
