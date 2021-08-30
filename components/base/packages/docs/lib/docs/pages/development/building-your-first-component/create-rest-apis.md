---
id: create-rest-apis
title: Create REST APIs for your Component
sidebar_label: Create REST APIs
---

Assuming you have already created the service package as mentioned in [previous section](/development/building-your-first-component/create-services),
let's work on wrapping that into REST APIs.

The code uses [Express.JS](https://expressjs.com/) framework using another open source Serverless Framework library
for AWS Lambda named [serverless-http](https://www.npmjs.com/package/serverless-http).
The library provides an easy way to write APIs by writing express.js middleware functions.
To use this, you need to ensure that you have installed `base-rest-api` component.
If you see `components/base-rest-api` in your project directory then it is already installed.
If not, then make sure to install that component first by following the component's README.md and INSTALLATION.md instructions.

This component provides a `backend` deployment unit that creates an API Handler Lambda function and fronts it with an
[Amazon API Gateway](https://aws.amazon.com/api-gateway/) to provide REST APIs.
The API Handler function provided by the `base-rest-api` component also initializes the express.js application within the
Lambda function and provides various hooks to easily add additional API routes.

## Create rest-apis package

Let's create a package for rest-apis of our component.

```bash
cd components/project-s3-buckets/packages
mkdir -p project-s3-buckets-rest-api
```

Create a `package.json` file with the following content in the `project-s3-buckets-rest-api` directory you just created.

```json
{
  "name": "@aws-ee/project-s3-buckets-rest-api",
  "private": true,
  "version": "0.0.1",
  "description": "Controllers package for the project-s3-buckets component",
  "license": "SEE LICENSE IN LICENSE",
  "main": "dist/index.js",
  "dependencies": {
    "@aws-ee/base-controllers": "workspace:*",
    "@aws-ee/project-s3-buckets-services": "workspace:*",
    "@babel/runtime": "^7.12.5"
  },
  "devDependencies": {
    "@babel/cli": "^7.12.10",
    "@babel/core": "^7.12.10",
    "@babel/preset-env": "^7.12.11",
    "babel-plugin-add-module-exports": "^1.0.4",
    "eslint": "^6.8.0",
    "eslint-config-airbnb-base": "^14.1.0",
    "eslint-config-prettier": "^6.10.0",
    "eslint-import-resolver-node": "^0.3.3",
    "eslint-plugin-import": "^2.20.1",
    "eslint-plugin-jest": "^22.21.0",
    "eslint-plugin-prettier": "^3.1.2",
    "husky": "^3.1.0",
    "jest": "^24.9.0",
    "jest-junit": "^10.0.0",
    "prettier": "^1.19.1",
    "pretty-quick": "^1.11.1",
    "regenerator-runtime": "^0.13.7",
    "source-map-support": "^0.5.16"
  },
  "scripts": {
    "test": "NODE_ENV=test jest --config jest.config.js --coverage",
    "test:watch": "NODE_ENV=test jest --config jest.config.js --watchAll",
    "babel": "babel --delete-dir-on-start lib/ --out-dir dist/ --source-maps --copy-files",
    "babel:watch": "babel lib/ --out-dir dist/ --source-maps --copy-files --watch",
    "build": "pnpm run babel",
    "build:watch": "pnpm run babel:watch",
    "lint": "pnpm run lint:eslint && pnpm run lint:prettier",
    "lint:eslint": "eslint --ignore-path .gitignore . ",
    "lint:prettier": "prettier --check --ignore-path .gitignore '**/*.{js,jsx}' ",
    "format": "pnpm run format:eslint && pnpm run format:prettier",
    "format:eslint": "eslint --fix --ignore-path .gitignore . ",
    "format:prettier": "prettier --write --ignore-path .gitignore '**/*.{js,jsx}' ",
    "prepare": "pnpm run build"
  },
  "husky": {
    "hooks": {
      "pre-commit": "pretty-quick --staged --pattern '**/*.*(js|jsx)'"
    }
  }
}
```

## Add general package configuration files

The component JavaScript packages use certain tools as follows.

- [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/) for code styling and formatting
- [BabelJS](https://babeljs.io/) for transpiling the code from ES2020 syntax.
- [Jest](https://github.com/facebook/jest) for unit tests.

Let's copy the following common configuration files for these tools from one of the existing component packages.
We will copy them from base-rest-api's _base-controllers_ package for this example.

```bash
cd project-s3-buckets-rest-api
cp ../../../base-rest-api/packages/base-controllers/jsconfig.json \
   ../../../base-rest-api/packages/base-controllers/jest.config.js \
   ../../../base-rest-api/packages/base-controllers/.prettierrc.json \
   ../../../base-rest-api/packages/base-controllers/.babelrc \
   ../../../base-rest-api/packages/base-controllers/.eslintrc.json \
   ../../../base-rest-api/packages/base-controllers/setup-tests.js \
   ../../../base-rest-api/packages/base-controllers/.gitignore .
```

## Write the controller

Controllers map various API routes to their handler functions.
Controllers are thin layer of code that delegate the call to a specific Service method to execute business logic.

- Create a `lib` directory under the `project-s3-buckets-rest-api` directory.
  We will keep all source code for this package under this directory.

```bash
mkdir -p lib
```

- Create a `controllers` directory under `lib`.
- Create a JavaScript file named `project-s3-buckets-controller.js` under the `lib/controllers` directory.
- Add the following controller code to the file you just created.
  Read inline comments in the file for additional information.

```javascript
/**
 * Configures API routes
 *
 * @param context - an instance of the AppContext defined in base-rest-api
 */
async function configure(context) {
  const router = context.router();
  const wrap = context.wrap;

  /**
   * @openapi
   * paths:
   *   /api/project-buckets:
   *     get:
   *       summary: List project buckets
   *       description: Lists Amazon S3 buckets created by this project
   *       operationId: listProjectBuckets
   *       tags:
   *         - ProjectBuckets
   *       responses:
   *         "401":
   *           $ref: "#/components/responses/Unauthorized"
   */
  router.get(
    '/',
    wrap(async (req, res) => {
      // Get the service from the context.
      // The context is an instance of the AppContext ("components/base-rest-api/packages/api-handler-factory/lib/app-context.js")
      // from the "base-rest-api" component's "api-handler-factory" package
      const [projectS3BucketsService] = await context.service(['projectS3BucketsService']);

      // Get the requestContext from the res object
      // The requestContext is an instance of RequestContext class ("components/base/packages/services-container/lib/request-context.js")
      // The requestContext is initialized by the "components/base-rest-api/packages/base-controllers/lib/middlewares/prepare-context.js" middleware function.
      const requestContext = res.locals.requestContext;

      // Call the service to list the project s3 buckets
      const result = await projectS3BucketsService.list(requestContext);

      // Send the JSON response with 200 status code
      res.status(200).json(result);
    }),
  );

  return router;
}

export default configure;
```

## Write routes plugin

Each component's rest-api package provides a plugin to register its own controllers to the routes map.
This way the users of the component can easily register all controllers from the component by just calling one plugin instead of having to deal with individual controllers.
Let's write the plugin to register the `project-s3-buckets-controller` we just created above.
This plugin will be later registered to the plugin-registry against the `route` extension point when we integrate this component with the rest of the project.

- Create a `plugins` directory under the `lib`. We will keep the plugin here.
- Add a file named `routes-plugin.js` to the `lib/plugins` directory you just created. With the following code.

```javascript
import { setupAuthContext, prepareContext, ensureActive, ensureAdmin } from '@aws-ee/base-controllers';

import projectS3BucketsController from '../controllers/project-s3-buckets-controller';

/**
 * Adds routes to the given routesMap.
 *
 * @param routesMap A Map containing routes. This object is a Map that has route paths as
 * keys and an array of functions that configure the router as value. Each function in the
 * array is expected have the following signature. The function accepts context and router
 * arguments and returns a configured router.
 *
 * (context, router) => configured router
 *
 * @param pluginRegistry A registry that provides plugins registered by various components for the specified extension point.
 *
 * @returns {Promise<*>} Returns a Map with the mapping of the routes vs their router configurer functions
 */
// eslint-disable-next-line no-unused-vars
async function getRoutes(routesMap, pluginRegistry) {
  const routes = new Map([
    ...routesMap,
    // Protected APIs accessible only to logged in active and admin users
    // Map '/api/project-buckets' route to an array of middleware functions as follows
    //  - setupAuthContext - extracts username, userId, authentication provider and identity provider name from the request.
    //  - prepareContext - Prepares request context which has information about the Principal. Adds user metadata by fetching current user information from Users table in DynamoDB (role, active/inactive, etc). This info is used in authorization code.
    //  - ensureActive - Middleware function that return 403 error if the caller is not an active user
    //  - ensureAdmin - Middleware function that return 403 error if the caller is not an admin
    ['/api/project-buckets', [setupAuthContext, prepareContext, ensureActive, ensureAdmin, projectS3BucketsController]],
  ]);
  return routes;
}

const plugin = {
  getRoutes,
};

export default plugin;
```

## Export the plugin

Last thing we need to do to wrap up the rest-apis package is to export the routes plugin we just created.
This will ensure that we can later import this plugin to add it to the plugin-registry when integrating this component to the rest of the project.

- Create a file named `index.js` under the `lib` directory with the following code.

```javascript
export { default as routesPlugin } from './plugins/routes-plugin';
```
