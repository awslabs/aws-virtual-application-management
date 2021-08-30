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

const logRequest = require('./util');

async function configure(context) {
  const router = context.router();
  const wrap = context.wrap;

  // ===============================================================
  //  GET / (mounted to /api/appstream-images)
  // ===============================================================
  router.get(
    '/',
    wrap(async (req, res) => {
      logRequest(req);
      const requestContext = res.locals.requestContext;
      const [appstreamService] = await context.service(['appstreamService']);
      const list = await appstreamService.listImages(requestContext);
      res.status(200).json(list);
    }),
  );

  router.post(
    '/:imageName/share',
    wrap(async (req, res) => {
      logRequest(req);
      const requestContext = res.locals.requestContext;
      const [appstreamService] = await context.service(['appstreamService']);
      const imageName = req.params.imageName;
      const { accountId } = req.body;
      const result = await appstreamService.shareImage(requestContext, {
        imageName,
        accountId,
      });
      res.status(200).json(result);
    }),
  );

  router.delete(
    '/:imageName/share',
    wrap(async (req, res) => {
      logRequest(req);
      const requestContext = res.locals.requestContext;
      const [appstreamService] = await context.service(['appstreamService']);
      const imageName = req.params.imageName;
      const { accountId } = req.body;
      const result = await appstreamService.revokeImageSharing(requestContext, {
        imageName,
        accountId,
      });
      res.status(200).json(result);
    }),
  );

  router.post(
    '/create',
    wrap(async (req, res) => {
      logRequest(req);
      const requestContext = res.locals.requestContext;
      const [appstreamService] = await context.service(['appstreamService']);
      const {
        imageName,
        applications,
        dapEnabled,
        imageBuilderID,
        snapshotImage,
        deleteImageBuilder,
        instanceType,
        appstreamImageArn,
      } = req.body;
      const result = await appstreamService.createImage(requestContext, {
        imageName,
        applications,
        dapEnabled,
        imageBuilderID,
        snapshotImage,
        deleteImageBuilder,
        instanceType,
        appstreamImageArn,
      });
      res.status(200).json(result);
    }),
  );

  router.delete(
    '/:imageName',
    wrap(async (req, res) => {
      logRequest(req);
      const requestContext = res.locals.requestContext;
      const [appstreamService] = await context.service(['appstreamService']);
      const imageName = req.params.imageName;
      const result = await appstreamService.deleteImage(requestContext, {
        imageName,
      });
      res.status(200).json(result);
    }),
  );

  return router;
}
module.exports = configure;
