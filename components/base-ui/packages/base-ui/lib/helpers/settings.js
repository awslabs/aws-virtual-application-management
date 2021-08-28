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

const isLocalDev = process.env.REACT_APP_LOCAL_DEV === 'true';
const awsRegion = process.env.REACT_APP_AWS_REGION;
const apiPath = process.env.REACT_APP_API_URL;
const websiteUrl = process.env.REACT_APP_WEBSITE_URL;
// websiteBaseName is used as a root path for the website
// for example, https://<domain name>/<websiteBaseName>/<component or web page>
const websiteBaseName = process.env.PUBLIC_URL;
const docsUrl = process.env.REACT_APP_DOCS_URL;
const stage = process.env.REACT_APP_STAGE;
const region = process.env.REACT_APP_REGION;
const autoLogoutTimeoutInMinutes = process.env.REACT_APP_AUTO_LOGOUT_TIMEOUT_IN_MINUTES || 30;

let temporarySupportedLanguages = process.env.REACT_APP_SUPPORTED_LANGUAGES;
const defaultLanguage = process.env.REACT_APP_DEFAULT_LANGUAGE;

const namespace = process.env.REACT_APP_NAMESPACE;

const branding = {
  login: {
    title: process.env.REACT_APP_BRAND_LOGIN_TITLE,
    subtitle: process.env.REACT_APP_BRAND_LOGIN_SUBTITLE,
  },
  main: {
    title: process.env.REACT_APP_BRAND_MAIN_TITLE,
  },
  page: {
    title: process.env.REACT_APP_BRAND_PAGE_TITLE,
  },
};

// If undefined, default to English. This helps in unit tests that may exist outside of a preference for language.
// If set, try to decode and allow failure to bubble up. This allows developers to get immediate feedback on problematic
// changes.
try {
  temporarySupportedLanguages = JSON.parse(temporarySupportedLanguages || '{"en":"en"}');
} catch (_e) {
  console.warn(
    "No internationalization has been configured. Check the 'supportedLanguages' fields in the solution settings.",
  );
  temporarySupportedLanguages = {};
}

const supportedLanguages = temporarySupportedLanguages;

const isNullOrUndefined = str => str === 'null' || str === 'undefined';

const version = process.env.REACT_APP_VERSION;
const versionDisclaimerHeader = isNullOrUndefined(process.env.REACT_APP_VERSION_DISCLAIMER_HEADER)
  ? null
  : process.env.REACT_APP_VERSION_DISCLAIMER_HEADER;
const versionDisclaimerContent = isNullOrUndefined(process.env.REACT_APP_VERSION_DISCLAIMER_CONTENT)
  ? null
  : process.env.REACT_APP_VERSION_DISCLAIMER_CONTENT;

export {
  awsRegion,
  apiPath,
  isLocalDev,
  websiteUrl,
  websiteBaseName,
  docsUrl,
  stage,
  region,
  branding,
  autoLogoutTimeoutInMinutes,
  supportedLanguages,
  defaultLanguage,
  version,
  versionDisclaimerHeader,
  versionDisclaimerContent,
  namespace,
};
