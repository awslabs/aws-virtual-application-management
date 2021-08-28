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
/**
 * Configures Dynamic Catalog routes
 *
 * @param context - an instance of the AppContext defined in base-rest-api
 *
 * @openapi
 * components:
 *   schemas:
 *     dynamicCatalog:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         rev:
 *           type: integer
 *         sharedGroups:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               name:
 *                 type: string
 *         fleet:
 *           type: string
 *         createdAt:
 *           type: string
 *         createdBy:
 *           type: string
 *         updatedAt:
 *           type: string
 *         updatedBy:
 *           type: string
 *     createDynamicCatalog:
 *       type: object
 *       properties:
 *         dynamicCatalogName:
 *           type: string
 *         fleet:
 *           type: string
 *         applications:
 *           type: array
 *           items:
 *             type: string
 *     putDynamicCatalogGroup:
 *       type: object
 *       properties:
 *         groupId:
 *           type: string
 *         groupName:
 *           type: string
 *     deleteDynamicCatalogGroup:
 *       type: object
 *       properties:
 *         groupId:
 *           type: string
 */
async function configure(context) {
  const router = context.router();
  const wrap = context.wrap;

  /**
   * @openapi
   * paths:
   *   /api/dynamic-catalogs:
   *     get:
   *       summary: List dynamic catalogs
   *       description: List dynamic catalogs inc. applications assigned and group assignment
   *       operationId: getDynamicCatalogs
   *       tags:
   *         - Dynamic Catalogs
   *       responses:
   *         "200":
   *           description: List of dynamic catalogs
   *           content:
   *             "application/json":
   *               schema:
   *                 type: array
   *                 items:
   *                   $ref: "#/components/schemas/dynamicCatalog"
   *         "400":
   *           $ref: "#/components/responses/InvalidInput"
   *         "403":
   *           $ref: "#/components/responses/Forbidden"
   *         "500":
   *           $ref: "#/components/responses/Internal"
   */
  router.get(
    '/',
    wrap(async (req, res) => {
      logRequest(req);
      const requestContext = res.locals.requestContext;
      const [dynamicCatalogService] = await context.service(['dynamicCatalogService']);
      const list = await dynamicCatalogService.list(requestContext);
      res.status(200).json(list);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/dynamic-catalogs/create:
   *     post:
   *       summary: Create dynamic catalog
   *       description: Create dynamic catalog by specifying fleet & applications to include
   *       operationId: createDynamicCatalog
   *       requestBody:
   *         required: true
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/createDynamicCatalog"
   *       tags:
   *         - Dynamic Catalogs
   *       responses:
   *         "200":
   *           description: Successfully created dynamic catalog
   *           content:
   *             "application/json":
   *               schema:
   *                 $ref: "#/components/schemas/dynamicCatalog"
   *         "400":
   *           $ref: "#/components/responses/InvalidInput"
   *         "403":
   *           $ref: "#/components/responses/Forbidden"
   *         "500":
   *           $ref: "#/components/responses/Internal"
   */
  router.post(
    '/create',
    wrap(async (req, res) => {
      logRequest(req);
      const requestContext = res.locals.requestContext;
      const [dynamicCatalogService] = await context.service(['dynamicCatalogService']);
      const { dynamicCatalogName, fleet, applications } = req.body;
      const result = await dynamicCatalogService.createDynamicCatalog(requestContext, {
        dynamicCatalogName,
        fleet,
        applications,
      });
      res.status(200).json(result);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/dynamic-catalogs/{id}:
   *     delete:
   *       summary: Delete dynamic catalog
   *       description: Delete dynamic catalog by id
   *       operationId: deleteDynamicCatalog
   *       tags:
   *         - Dynamic Catalogs
   *       responses:
   *         "200":
   *           description: Successfully deleted dynamic catalog
   *         "400":
   *           $ref: "#/components/responses/InvalidInput"
   *         "403":
   *           $ref: "#/components/responses/Forbidden"
   *         "500":
   *           $ref: "#/components/responses/Internal"
   */
  router.delete(
    '/:id',
    wrap(async (req, res) => {
      logRequest(req);
      const requestContext = res.locals.requestContext;
      const id = req.params.id;
      const [dynamicCatalogService] = await context.service(['dynamicCatalogService']);
      const result = await dynamicCatalogService.deleteDynamicCatalog(requestContext, { id });
      res.status(200).json(result);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/dynamic-catalogs/access:
   *     put:
   *       summary: Add group to dynamic catalog
   *       description: Add an AD group to a dynamic catalog's access list
   *       operationId: addAccessToDynamicCatalog
   *       requestBody:
   *         required: true
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/putDynamicCatalogGroup"
   *       tags:
   *         - Dynamic Catalogs
   *       responses:
   *         "200":
   *           description: Successfully added group to dynamic catalog
   *         "403":
   *           $ref: "#/components/responses/Forbidden"
   *         "500":
   *           $ref: "#/components/responses/Internal"
   */
  router.put(
    '/:id/access',
    wrap(async (req, res) => {
      logRequest(req);
      const requestContext = res.locals.requestContext;
      const [dynamicCatalogService] = await context.service(['dynamicCatalogService']);
      const id = req.params.id;
      const { groupId, groupName } = req.body;
      await dynamicCatalogService.grantAccess(requestContext, { id, groupId, groupName });
      const result = { id: groupId, name: groupName };
      res.status(200).json(result);
    }),
  );

  /**
   * @openapi
   * paths:
   *   /api/dynamic-catalogs/access:
   *     delete:
   *       summary: Remove group from dynamic catalog
   *       description: Remove AD group from a dynamic catalog's access list
   *       operationId: removeAccessToDynamicCatalog
   *       requestBody:
   *         required: true
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/deleteDynamicCatalogGroup"
   *       tags:
   *         - Dynamic Catalogs
   *       responses:
   *         "200":
   *           description: Successfully removed group from dynamic catalog
   *         "403":
   *           $ref: "#/components/responses/Forbidden"
   *         "500":
   *           $ref: "#/components/responses/Internal"
   */
  router.delete(
    '/:id/access',
    wrap(async (req, res) => {
      logRequest(req);
      const requestContext = res.locals.requestContext;
      const [dynamicCatalogService] = await context.service(['dynamicCatalogService']);
      const id = req.params.id;
      const { groupId } = req.body;
      await dynamicCatalogService.revokeAccess(requestContext, { id, groupId });
      const result = { id, groupId };
      res.status(200).json(result);
    }),
  );

  return router;
}

module.exports = configure;
