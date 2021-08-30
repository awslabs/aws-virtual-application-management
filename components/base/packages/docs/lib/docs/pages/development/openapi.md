---
id: openapi
title: OpenAPI Documentation
sidebar_label: OpenAPI Documentation
---

## Overview

[OpenAPI](https://www.openapis.org/) documentation is available for many components within this documentation site. The OpenAPI documentation is embedded as YAML within JSDoc comments; when the documentation site is built

- [swagger-jsdoc](https://www.npmjs.com/package/swagger-jsdoc) extracts the embedded OpenAPI into a single YAML file
- [redocusaurus](https://www.npmjs.com/package/redocusaurus) converts the OpenAPI YAML into the Docusaurus documentation within this documentation site

## Adding OpenAPI documentation to an API endpoint

### 1. Create a docs plugin

The plugin must

- be created as `docs-plugin.js` in the `lib/plugins/` folder of the component's api package
- contain a `getConfiguration` function that appends to the `controllerConfigs` property of its parameter the properties
  - `schemas`: an object containing each JSON schema that is to be incorporated within the OpenAPI documentation. The schema names must be unique across all API endpoints.
  - `filePath`: a path referencing all js with embedded OpenAPI documentation.

For example, the following exports

- JSON schemas
  - `schemaA` from a json file
  - `schemaB` and `schemaC` from a js file
- js containing OpenAPI documentation from the `controllers` folder

```javascript
import path from 'path';
import schemaA from '@aws-ee/endpoint-services/lib/schema/schemaA.json';
import { schemaB, schemaC } from '@aws-ee/endpoint-services';

function getControllerConfigs(controllerConfigsSoFar) {
  const filePath = path.resolve(__dirname, '../controllerFilePaths/**/*.js');
  const schemas = { schemaA, schemaB, schemaC };
  return [...controllerConfigsSoFar, { filePath, schemas }];
}

async function getConfiguration(configSoFar) {
  const updatedConfig = {
    ...configSoFar,
    controllerConfigs: getControllerConfigs(configSoFar.controllerConfigs),
  };
  return updatedConfig;
}

const plugin = {
  getConfiguration,
};

export default plugin;
```

### 2. Export the docs plugin

Add the following to `lib/plugins/index.js` within the api package

```javascript
export { default as docsPlugin } from './plugins/docs-plugin';
```

### 3. Add the assembly entries for the documentation for the component

#### 3.1. Modify `$PROJECT_HOME/main/packages/registry-docs/package.json`:

Add to `dependencies`:

```json
  "@aws-ee/example-api": "workspace:*",
```

#### 3.2. Modify `$PROJECT_HOME/main/packages/registry-docs/lib/plugin-registry.js`:

Add to imports:

```javascript
import { docsPlugin as exampleApiDocsPlugin } from '@aws-ee/example-api';
```

Add to `extensionPoints.docs`:

```javascript
  exampleApiDocsPlugin,
```

### 4. Update the component installation instructions

Add the steps described in the previous section to `INSTALLATION.md` for the component

### 5. Add the OpenAPI documentation to the API endpoint

Namespacing is important for OpenAPI documentation, since everything is combined into a single OpenAPI object for documentation. Names likely to clash across components should be prefixed with the operation or package name. A global definitions file, described below, contains items that are to be shared across all components; this should be added to where a definition is to be used everywhere.

#### 5.1 Common definitions

##### 5.1.1 Global

`components/base/packages/docs/lib/docs/openapi-common.json` contains global definitions for parameters and responses, including

- `maxResults` and `nextToken` parameters for pagination
- Responses for
  - `Success`
  - `Forbidden`
  - `Unauthorized`
  - `InvalidInput`
  - `AlreadyExists`
  - `NotFound`
  - `AlreadyExists`
  - `Internal`

##### 5.1.2 Local

At the start of the JS file for the API endpoint, add JSDoc comments for `async function configure` preceded by `@openapi` containing OpenAPI YAML documentation for parameters and responses, which you may wish to reference in your own controller documentation. This includes:

```javascript
/**
 * @openapi
 * components:
 *   parameters:
 *     {parameter definitions}:
 *   responses:
 *     {response definitions}:
 *   schemas:
 *     {schema definitions}:
 */
```

Example:

```javascript
/**
 * @openapi
 * components:
 *   parameters:
 *     fileFields:
 *       name: fileFields
 *       in: query
 *       description: Fields to include
 *       schema:
 *         type: array
 *   responses:
 *     File:
 *       description: File
 *     Files:
 *       description: Files
 */
```

#### 5.2 Endpoint documentation

##### 5.2.1 Path and verb

OpenAPI comments for an endpoint should begin with `@openapi`, followed by the path and associated HTTP verb (`get`, `put`, etc):

```javascript
 * @openapi
 * paths:
 *   {endpoint path}:
 *     {endpoint HTTP verb}:
```

Example:

```javascript
  /**
   * @openapi
   * paths:
   *   /api/datasets/{datasetId}/files:
   *     get:
```

##### 5.2.2 Summary, description, tags and id

Tags may include spaces, and are used to group related endpoints. When the OpenAPI is rendered in Docusaurus the API endpoints are grouped by tag, with each endpoint appearing in every tag group that it belongs to.

```javascript
 *       summary: {summary}
 *       tags: {comma delimited tags}
 *       description: {description}
 *       operationId: {operation id}
```

Example:

```javascript
 *       summary: List files
 *       description: Lists files in the dataset with specified id
 *       operationId: listFiles
 *       tags:
 *         - Files
```

##### 5.2.3 Parameters

```javascript
 *       parameters:
 *         - name: {name}
 *           in: {path|query}
 *           description: {description}
 *           schema:
 *             {schema|ref link to schema}
```

Example:

```javascript
 *       parameters:
 *         - name: by
 *           in: query
 *           description: Attribute(s) to return the results by
 *           schema:
 *             type: string
 *             enum:
 *               - all
 *               - s3Uri
 *               - locationRadius
 *               - locationRectangle
 *               - latestVersions
 *             default: latestVersions
```

##### 5.2.3.1 Global Parameters

Globally defined parameters, such as `maxResults` and `nextToken`, may be referenced using a `$ref` link to their schema within the `docs-plugin.js` file described above: `$ref: "#/components/schemas/{schema name}`.

Example:

```javascript
   *       parameters:
   *         - $ref: "#/components/parameters/maxResults"
   *         - $ref: "#/components/parameters/nextToken"
```

##### 5.2.3.2 Local Parameters

Local parameters may be defined at the start of the JS file for the API endpoint. Although the parameter must have a globally unique name, its name field is local to the parameter; this allows common names such as `id` to be used as parameter properties.

Example:

```javascript
/**
 * @openapi
 * components:
 *   parameters:
 *     keyPairId:
 *       name: id
 *       required: true
 *       in: path
 *       description: Key pair id
 *       schema:
 *         type: string
```

These can then be referenced within the JSDoc comments for the API endpoint.

Example:

```javascript
   *       parameters:
   *         - $ref: "#/components/parameters/keyPairId"
```

To reference a sub-schema append its path: `$ref: "#/components/schemas/{schema name}/{path to sub-schema}`

Example:

```javascript
   *       parameters:
   *         - name: latitude
   *           in: query
   *           schema:
   *               $ref: "#/components/schemas/findByLocationRadius/definitions/location/properties/latitude"
```

##### 5.2.3.3 Inline Parameters

Parameters unique to an API endpoint can be defined within a parameters section.

Example:

```javascript
   *       parameters:
   *         - name: by
   *           in: query
   *           description: Attribute(s) to return the results by
   *           schema:
   *             type: string
```

##### 5.2.4 Body

For operations such as file upload that include a request body, this may be defined along with associated schema:

```javascript
   *       requestBody:
   *         required: true
   *         content:
   *           application/json:
   *             schema:
   *               {ref link to schema}
```

For example:

```javascript
   *       requestBody:
   *         required: true
   *         content:
   *           application/json:
   *             schema:
   *               $ref: "#/components/schemas/updateFile"
```

##### 5.2.5 Responses

OpenAPI allows a response to be associated with each HTTP response code. Only a single response per code is allowed, so if multiple responses with the same code may be produced these should be described generically (eg defining `400` as invalid input).

JSON schema are typically defined for input validation rather than output, so are unlikely to be referenced here. However, endpoints often return the same data, and so local definitions can be useful.

Responses are defined as

```javascript
 *       responses:
 *         {HTTP response code}:
 *           {response}
```

For example:

```javascript
 *       responses:
 *         "200":
 *           description: Confirms organization user with specified id was deleted
 *         "401":
 *           $ref: "#/components/responses/Unauthorized"
 *         "404":
 *           $ref: "#/components/responses/NotFound"
```

## Building OpenAPI documentation

### Deploying to AWS

Assemble and deploy the solution as per `README.md` within the root of the solution

### Local development

1. Assemble the solution as above for deployment.
2. Within `main/.generated-solution/docs` execute `pnpx sls start-ui`
3. When updates are made to the JSDoc OpenAPI documentation for an API endpoint
   - Execute `pnpm build:watch` for the API package of the component, or `pnpx solution-build-watch` for the entire solution
   - If changes to global definitions within `components/base/packages/docs/lib/docs/openapi-common.json` then `pnpm:build` the `docs` package of the base component.
   - Execute `pnpx sls start-ui` within `main/.generated-solution/docs`. This will open the local docs site URL within the default browser.
   - If changes within the JSDoc OpenAPI documentation are not reflected in the docs site then remove `.generated-solution` and re-assemble the solution.

## Troubleshooting

- Ensure the documentation follows the [OpenAPI 3.03](https://swagger.io/specification/) exactly. Common syntax errors include
  - Incorrect indentation
  - Colons between keys and values
  - Dashes for array items
- The OpenAPI documentation is generated as a single file in `main/.generated-solution/docs/dist-autogen/openapi.yaml`; this can be used to root cause documentation errors
- Useful VSCode features include
  - [multi cursor editing](https://code.visualstudio.com/docs/editor/codebasics#_multiple-selections-multicursor), for example to correct indentation of YAML items within JSDoc
  - [openapi-designer](https://marketplace.visualstudio.com/items?itemName=philosowaffle.openapi-designer) to preview OpenAPI files
  - [vscode-openapi](https://marketplace.visualstudio.com/items?itemName=42Crunch.vscode-openapi) adds features such as IntelliSense, jumping to references and preview
