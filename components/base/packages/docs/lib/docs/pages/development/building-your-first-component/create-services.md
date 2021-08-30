---
id: create-services
title: Create Services for your Component
sidebar_label: Create Services
---

As a convention, the components capture business logic in separate classes called _Services_.
Each _Service_ is a single purpose class containing specific business logic.

## Create services package

Let's create a package for services of our component.

```bash
cd components/project-s3-buckets/packages
mkdir -p project-s3-buckets-services
```

Create a `package.json` file with the following content in the `project-s3-buckets-services` directory you just created.

```json
{
  "name": "@aws-ee/project-s3-buckets-services",
  "private": true,
  "version": "0.0.1",
  "description": "Services package for the project-s3-buckets component",
  "license": "SEE LICENSE IN LICENSE",
  "main": "dist/index.js",
  "dependencies": {
    "@aws-ee/base-services": "workspace:*",
    "@aws-ee/base-services-container": "workspace:*",
    "@babel/runtime": "^7.12.5",
    "lodash": "^4.17.21"
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
We will copy them from base _services_ package for this example.

```bash
cd project-s3-buckets-services
cp ../../../base/packages/services/jsconfig.json \
   ../../../base/packages/services/jest.config.js \
   ../../../base/packages/services/.prettierrc.json \
   ../../../base/packages/services/.babelrc \
   ../../../base/packages/services/.eslintrc.json \
   ../../../base/packages/services/setup-tests.js \
   ../../../base/packages/services/.gitignore .
```

## Write the service class

- Create a `lib` directory under the `project-s3-buckets-services` directory.
  We will keep all source code for this package under this directory.

```bash
mkdir -p lib
```

- Create a JavaScript file named `project-s3-buckets-service.js` under the `lib` directory.
- Add the following service code to the file you just created.
  Read inline comments in the file. These comments explain few important aspects of services development.

```javascript
import _ from 'lodash';

// The Service class from the "@aws-ee/base-services-container" package provided by the "base" component provides a
// base "Service" class for us to extend from. This base class provides certain methods such for reading services,
// referencing dependency services, logging etc.
// The "@aws-ee/base-services-container" package provides a container to register service instances and then use them from the registry.
// This allows us to build code without any hard coupling on specific implementations of services.
// The service implementations can be easily swapped out as long as they honor the same contract.
import { Service } from '@aws-ee/base-services-container';

// Get the few condition checks from base services, these utility conditions are useful for
// performing some basic authorization
import { allowIfActive, allowIfAdmin } from '@aws-ee/base-services';

class ProjectS3BucketsService extends Service {
  constructor() {
    super();
    // Declare dependency on few services our service will utilize:
    //
    // - "s3Service": Our service will use "s3Service" provided by the "base" to get S3 AWS SDK reference.
    // The "s3Service" provides certain higher level functions on top of S3 and also provides access to the AWS SDK for
    // S3 (in form of "api") initialized correctly with appropriate AWS credentials and signature and api version.
    // The "s3Service" internally loads the AWS SDK using other "aws" service provided by the "base" component.
    // That service takes care of initializing AWS SDK such that it assumes the same AWS Lambda function role even during local development.
    // Due to this, the code running locally on developer's machine runs under the same permissions as the deployed Lambda function in the AWS Cloud
    //
    // - "authorizationService": The "authorizationService" provided by the "base" provides a plugin driven mechanism for performing authorization.
    // The "authorizationService" receives the PARC (Principal, Action, Resource, Conditions) it evaluates various plugins registered under the
    // specified extension point and provides final authorization answer of allow/deny.
    this.dependency(['s3Service', 'authorizationService']);
  }

  async list(requestContext) {
    // Call private utility method to delegate to the authorization service
    // Pass basic conditions to make sure the Principal is "active" and is "admin"
    await this._assertAuthorized(requestContext, { action: 'list', conditions: [allowIfActive, allowIfAdmin] });

    // Retrieve the s3Service, we can retrieve any service we declared a dependency using "this.dependency" method
    const s3Service = await this.service('s3Service');

    // Get the AWS S3 SDK instance initialized by the S3 service
    const s3Api = s3Service.api;

    // Call the listBuckets method on the AWS S3 SDK
    // The following call will only succeed if we have "s3:ListAllMyBuckets" permissions
    // These permissions need to be added to the AWS Lambda role in backend "cloudformation.yml" file for the API Handler lambda function.
    // This is done via "Solution Assembly"
    const result = (await s3Api.listBuckets().promise()) || { Buckets: [] };

    // Read the setting "globalNamespace".
    // The "settings" reads settings by converting environment variables with the naming pattern of "APP_SOME_VAR" and converts them to camelCase and removes the "APP_" prefix.
    // For example, the line below will ready the "globalNamespace" from environment variable named "APP_GLOBAL_NAMESPACE"
    const globalNamespace = this.settings.get('globalNamespace');

    // Select S3 buckets from the list that start with the globalNamespace as these S3 buckets are the ones created by this project
    const filteredList = _.filter(result.Buckets, (bucket) => _.startsWith(bucket.Name, globalNamespace));

    // Return the list of buckets
    return filteredList;
  }

  async _assertAuthorized(requestContext, { action, conditions }, ...args) {
    const authorizationService = await this.service('authorizationService');

    // The "authorizationService.assertAuthorized" below will evaluate permissions by calling the "conditions" functions first
    // It will then give a chance to all registered plugins (if any) to perform their authorization.
    // The plugins can even override the authorization decision returned by the conditions
    // See "authorizationService.authorize" method for more details
    await authorizationService.assertAuthorized(
      requestContext,
      { extensionPoint: 'project-s3-buckets-authz', action, conditions },
      ...args,
    );
  }
}

export default ProjectS3BucketsService;
```

## Write services plugin

Each component's "services" package provides a plugin to register its own services to the service container.
This way the users of the component can easily register all services from the component by just calling one plugin instead of having to deal with individual service instances.
Let's write the plugin to register the `ProjectS3BucketsService` we just created above.
This plugin will be later registered to the plugin-registry against the `service` extension point when we integrate this component with the rest of the project.

- Create a `plugins` directory under the `lib`. We will keep the plugin here.
- Add a file named `services-plugin.js` to the `lib/plugins` directory you just created. With the following code.

```javascript
import ProjectS3BucketsService from '../project-s3-buckets-service';

/**
 * Registers the services provided by this component.
 *
 * @param container An instance of ServicesContainer to register services to.
 * @param pluginRegistry A registry that provides plugins registered by various components for the specified extension point.
 *
 * @returns {Promise<void>}
 */
// eslint-disable-next-line no-unused-vars
async function registerServices(container, pluginRegistry) {
  container.register('projectS3BucketsService', new ProjectS3BucketsService());
}

const plugin = {
  // getStaticSettings, // not implemented, the default behavior provided by base component is sufficient
  // getLoggingContext, // not implemented, the default behavior provided by base component is sufficient
  // registerSettingsService, // not implemented, the default behavior provided by base component is sufficient
  // registerLoggerService, // not implemented, the default behavior provided by base component is sufficient
  registerServices,
};

export default plugin;
```

## Export the plugin

Last thing we need to do to wrap up the services package is to export the services plugin we just created.
This will ensure that we can later import this plugin to add it to the plugin-registry when integrating this component to the rest of the project.

- Create a file named `index.js` under the `lib` directory with the following code.

```javascript
export { default as servicesPlugin } from './plugins/services-plugin';
```
