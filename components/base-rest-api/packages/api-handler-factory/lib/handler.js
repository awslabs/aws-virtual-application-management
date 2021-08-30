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

import _ from 'lodash';
import express from 'express';
import serverless from 'serverless-http';
import compression from 'compression';
import bodyParser from 'body-parser';
import cors from 'cors';
import { ServicesContainer } from '@aws-ee/base-services-container';
import i18nHandler from './i18n-handler';
import errorHandler from './error-handler';
import AppContext from './app-context';

let cachedHandler;
let translators;

// registerServices = fn (required)
// registerRoutes = fn (required)
function handlerFactory({ registerServices, registerRoutes, registerI18n }) {
  return async (event, context) => {
    if (cachedHandler) return cachedHandler(event, context);

    const apiRouter = express.Router({ mergeParams: true });
    const app = express();
    app.disable('x-powered-by');

    // register services
    const servicesContainer = new ServicesContainer(['settings', 'log']);
    await registerServices(servicesContainer);
    await servicesContainer.initServices();

    // check circular dependencies
    const servicesList = servicesContainer.validate();

    // resolve settings and log services
    const logger = await servicesContainer.find('log');
    const settingsService = await servicesContainer.find('settings');

    // create app context
    const appContext = new AppContext({ app, settings: settingsService, log: logger, servicesContainer });

    // register routes
    await registerRoutes(appContext, apiRouter);

    // setup CORS, compression and body parser
    const isDev = settingsService.get('envType') === 'dev';
    let allowList = settingsService.optionalObject('corsAllowList', []);
    if (isDev) allowList = _.concat(allowList, settingsService.optionalObject('corsAllowListLocal', []));
    const corsOptions = {
      origin: (origin, callback) => {
        if (allowList.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      optionsSuccessStatus: 200,
    };

    //  i18n
    // Supported languages will be a hash of language names to the actual translation files that support that language e.g. {'en-GB':'en'}
    const supportedLanguagesSetting = settingsService.optional('supportedLanguages', '');
    if (!_.isEmpty(supportedLanguagesSetting)) {
      try {
        const supportedLanguages = JSON.parse(supportedLanguagesSetting);

        // The translators is a hash of 'roddeh-i18n' instances that are keyed based on the language files.
        translators = await registerI18n();

        // The defaultLanguage to use when the language associated with the request is not supported by the solution e.g. the http-header requests 'cn-ZH' but we don't support, so use English instead
        const defaultLanguage = settingsService.get('defaultLanguage');
        // The translator instance needs to be set on a per-request basis as requests coming for different languages may be handled by the same lambda instance.
        app.use(i18nHandler(translators, supportedLanguages, defaultLanguage));
      } catch (_e) {
        logger.warn('WARNING! Invalid supportedLanguages setting. I18N has not been configured.');
      }
    }

    app.use(compression());
    app.use(cors(corsOptions));
    app.use(bodyParser.json({ limit: '50mb' })); // see https://stackoverflow.com/questions/19917401/error-request-entity-too-large
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true })); // for parsing application/x-www-form-urlencoded
    // Set default security headers
    app.use((req, res, next) => {
      const securityHeaders = {};
      securityHeaders['strict-transport-security'] = 'max-age=63072000; includeSubdomains';
      const cspRules = [`default-src 'self'`];
      securityHeaders['content-security-policy'] = cspRules.join('; ');
      securityHeaders['x-content-type-options'] = 'nosniff';
      securityHeaders['x-frame-options'] = 'SAMEORIGIN';
      securityHeaders['x-xss-protection'] = '1; mode=block';
      securityHeaders['referrer-policy'] = 'same-origin';
      res.set(securityHeaders);
      next();
    });

    // mount all routes under /
    app.use('/', apiRouter);

    // add global error handler
    app.use(errorHandler());

    // allow options for all
    app.options('*');

    // prepare the handler
    cachedHandler = serverless(app, {
      callbackWaitsForEmptyEventLoop: true,
      request(req, { requestContext = {} }) {
        // expose the lambda event request context
        req.context = requestContext;
      },
    });

    const isVerbose = settingsService.optional('isVerbose', 'yes');
    if (isVerbose === 'yes') {
      // print useful information
      const settingsList = settingsService.entries;

      logger.info('Settings available are :');
      logger.info(settingsList);

      logger.info('Services available are :');
      logger.info(servicesList);
    }

    return cachedHandler(event, context);
  };
}

export default handlerFactory;
