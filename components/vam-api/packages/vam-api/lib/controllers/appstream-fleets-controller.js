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
  //  GET / (mounted to /api/appstream-fleets)
  // ===============================================================
  router.get(
    '/',
    wrap(async (req, res) => {
      logRequest(req);
      const requestContext = res.locals.requestContext;
      const [appstreamService] = await context.service(['appstreamService']);
      const list = await appstreamService.listFleets(requestContext);
      res.status(200).json(list);
    }),
  );

  router.get(
    '/:fleetName/get-link',
    wrap(async (req, res) => {
      logRequest(req);
      const requestContext = res.locals.requestContext;
      const [appstreamService] = await context.service(['appstreamService']);
      const fleetName = req.params.fleetName;
      const result = await appstreamService.getFleetTestLink(requestContext, { fleetName });
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
        fleetName,
        imageName,
        instanceType,
        fleetType,
        streamView,
        maxUserDurationInMinutes,
        disconnectTimeoutInMinutes,
        idleDisconnectTimeoutInMinutes,
        desiredCapacity,
      } = req.body;
      const result = await appstreamService.createFleet(requestContext, {
        fleetName,
        imageName,
        instanceType,
        fleetType,
        streamView,
        maxUserDurationInMinutes,
        disconnectTimeoutInMinutes,
        idleDisconnectTimeoutInMinutes,
        desiredCapacity,
      });
      res.status(200).json(result);
    }),
  );

  router.put(
    '/start',
    wrap(async (req, res) => {
      logRequest(req);
      const requestContext = res.locals.requestContext;
      const [appstreamService] = await context.service(['appstreamService']);
      const { fleetName } = req.body;
      const result = await appstreamService.startFleet(requestContext, { fleetName });
      res.status(200).json(result);
    }),
  );

  router.put(
    '/stop',
    wrap(async (req, res) => {
      logRequest(req);
      const requestContext = res.locals.requestContext;
      const [appstreamService] = await context.service(['appstreamService']);
      const { fleetName } = req.body;
      const result = await appstreamService.stopFleet(requestContext, { fleetName });
      res.status(200).json(result);
    }),
  );

  router.delete(
    '/:fleetName',
    wrap(async (req, res) => {
      logRequest(req);
      const requestContext = res.locals.requestContext;
      const fleetName = req.params.fleetName;
      const [appstreamService] = await context.service(['appstreamService']);
      const list = await appstreamService.deleteFleet(requestContext, { fleetName });
      res.status(200).json(list);
    }),
  );

  // ===============================================================
  //  PUT /:id/access (mounted to /api/appstream-fleets/)
  // ===============================================================
  router.put(
    '/:fleetName/access',
    wrap(async (req, res) => {
      logRequest(req);
      const requestContext = res.locals.requestContext;
      const [appstreamService] = await context.service(['appstreamService']);
      const fleetName = req.params.fleetName;
      const { groupId, groupName } = req.body;
      await appstreamService.grantFleetAccess(requestContext, { fleetName, groupId, groupName });
      const result = { id: groupId, name: groupName };
      res.status(200).json(result);
    }),
  );

  // ===============================================================
  //  DELETE /:id/access (mounted to /api/appstream-fleets/)
  // ===============================================================
  router.delete(
    '/:fleetName/access',
    wrap(async (req, res) => {
      logRequest(req);
      const requestContext = res.locals.requestContext;
      const [appstreamService] = await context.service(['appstreamService']);
      const fleetName = req.params.fleetName;
      const { groupId } = req.body;
      await appstreamService.revokeFleetAccess(requestContext, { fleetName, groupId });
      const result = { fleetName, groupId };
      res.status(200).json(result);
    }),
  );

  // ===============================================================
  //  PUT /:id/swap-image (mounted to /api/appstream-fleets/)
  // ===============================================================
  router.put(
    '/:fleetName/swap-image',
    wrap(async (req, res) => {
      logRequest(req);
      const requestContext = res.locals.requestContext;
      const [appstreamService] = await context.service(['appstreamService']);
      const fleetName = req.params.fleetName;
      const { imageName } = req.body;
      await appstreamService.swapFleetImage(requestContext, { fleetName, imageName });
      const result = { fleetName, imageName };
      res.status(200).json(result);
    }),
  );

  return router;
}
module.exports = configure;
