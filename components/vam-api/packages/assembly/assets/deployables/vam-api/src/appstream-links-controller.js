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

const _ = require('lodash');

async function configure(context) {
  const router = context.router();
  const wrap = context.wrap;

  const consoleLogger = {
    info(...args) {
      // eslint-disable-next-line no-console
      console.log(...args);
    },
  };

  function logRequest(req, log = consoleLogger) {
    const uid = _.get(req, 'context.authorizer.principalId') || 'Unknown User';
    const provider = _.get(req, 'context.authorizer.authenticationProviderId') || 'Unknown Provider';
    const method = _.get(req, 'method');
    const path = _.get(req, 'originalUrl');
    const userAgent = _.get(req, 'requestContext.identity.userAgent') || '';
    const ip = _.get(req, 'ip');
    log.info(`${method} ${ip} ${path} UID:${uid} Provider:${provider} ${userAgent}`);
  }
  // ===============================================================
  //  POST /prepare-link (mounted to /api/appstream-links/prepare-link)
  // ===============================================================
  router.post(
    '/prepare-link',
    wrap(async (req, res) => {
      logRequest(req);
      const requestContext = res.locals.requestContext;
      const [ltiService] = await context.service(['ltiService']);
      const result = await ltiService.handleLTIRequest(requestContext, req);
      res.redirect(result.link);
    }),
  );

  return router;
}

export default configure;
