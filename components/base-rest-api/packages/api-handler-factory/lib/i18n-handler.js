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

import i18n from 'roddeh-i18n';
import _ from 'lodash';

const i18nHandler = (translators, supportedLanguages = {}, defaultLanguage = 'en') => {
  return (req, _res, next) => {
    const available = _.keys(supportedLanguages);
    // Attempt to match based on the http heders
    const bestLanguage = req.acceptsLanguages(available);
    // Check if the language exists within our supported langauges, or default to the preferred language or finally 'en';
    const actualLanguage = supportedLanguages[bestLanguage] || defaultLanguage;
    // Attach the appropriate i18n instance for the request.
    req.i18n = translators[actualLanguage] || i18n;
    next();
  };
};

export default i18nHandler;
