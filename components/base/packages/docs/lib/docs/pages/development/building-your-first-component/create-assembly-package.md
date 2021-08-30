---
id: create-assembly-package
title: Create Assembly Package for your Component
sidebar_label: Create Assembly
---

Assuming you have already created the [service package](/development/building-your-first-component/create-services),
and the [rest apis](/development/building-your-first-component/create-rest-apis) packages the next step is to create
the _assembly_ package for the component.

## create "assembly" package

Let's create a package for assembly of our component.

```bash
cd components/project-s3-buckets/packages
mkdir -p assembly
```

Create a `package.json` file with the following content in the `assembly` directory you just created.

```json
{
  "name": "@aws-ee/project-s3-buckets-assembly",
  "private": true,
  "version": "1.0.0",
  "description": "The package for assembly instructions of the project-s3-buckets-assembly component",
  "license": "SEE LICENSE IN LICENSE",
  "main": "dist/index.js",
  "dependencies": {
    "@aws-ee/base-assembly-tasks": "workspace:*"
  },
  "devDependencies": {
    "@babel/cli": "^7.12.10",
    "@babel/core": "^7.12.10",
    "@babel/preset-env": "^7.12.10",
    "@types/jest": "^26.0.15",
    "eslint": "^6.8.0",
    "eslint-config-airbnb": "^18.1.0",
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
    "test": "NODE_ENV=test jest --config jest.config.js --passWithNoTests",
    "test:watch": "NODE_ENV=test jest --config jest.config.js  --passWithNoTests --watchAll",
    "babel": "babel --delete-dir-on-start lib/ --out-dir dist/ --source-maps --copy-files",
    "babel:watch": "babel lib/ --out-dir dist/ --source-maps --copy-files --watch",
    "build": "pnpm run babel",
    "build:watch": "pnpm run babel:watch",
    "lint": "pnpm run lint:eslint && pnpm run lint:prettier",
    "lint:eslint": "eslint . ",
    "lint:prettier": "prettier --check '**/*.{js,jsx}' ",
    "format": "pnpm run format:eslint && pnpm run format:prettier",
    "format:eslint": "eslint --fix . ",
    "format:prettier": "prettier --write '**/*.{js,jsx}' ",
    "prepare": "pnpm run build"
  },
  "files": ["LICENSE", "README.md", "dist/", "src/"],
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
We will copy them from base _assembly_ package for this example.

```bash
cd assembly
cp ../../../base/packages/assembly/jsconfig.json \
   ../../../base/packages/assembly/jest.config.js \
   ../../../base/packages/assembly/.prettierignore \
   ../../../base/packages/assembly/.prettierrc.json \
   ../../../base/packages/assembly/.babelrc \
   ../../../base/packages/assembly/.eslintignore \
   ../../../base/packages/assembly/.eslintrc.json \
   ../../../base/packages/assembly/setup-tests.js \
   ../../../base/packages/assembly/.gitignore .
```

## Add component "assets"

The `project-s3-buckets-service.js` service we created earlier calls the `ListBuckets` Amazon S3 API.
The service runs under the API Handler Lambda function.
The function is created by the `backend` deployment unit contributed by the `base-rest-apis` component.
We need to add `s3:ListAllMyBuckets` permission to the API Handler Lambda function's execution role.
The service also reads `globalNamespace` configuration to filter out the S3 buckets created by this project.
The setting is mapped based on the environment variables passed to the lambda function.
We need to add the `APP_GLOBAL_NAMESPACE` environment variable to the API Handler Lambda function.

Let's create assets override directory with file fragments to add the permission and the environment variable.
Make sure you are in the assembly directory.

```bash
mkdir -p assets/overrides
```

Now let's create directory structure to keep the file fragments we want to merge to the
`main/.generated-solution/backend` deployment unit

```bash
cd assets/overrides
mkdir -p backend/config/infra
```

Create the `cloudformation.yml` file fragment under the `backend/config/infra` directory you just created.
Add the `s3:ListAllMyBuckets` permission in the file to add it to the API Handler Lambda function's execution role.

```yaml
Resources:
  # IAM Role for the apiHandler Function
  RoleApiHandler:
    Properties:
      Policies:
        - PolicyName: list-s3-access
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action:
                  - s3:ListAllMyBuckets
                Resource:
                  - !Sub 'arn:${AWS::Partition}:s3:::*'
```

Create the `functions.yml` file fragment under the `backend/config/infra` directory.
Add the `APP_GLOBAL_NAMESPACE` environment variable to the API Handler Lambda function.

```yaml
apiHandler:
  environment:
    APP_GLOBAL_NAMESPACE: '${self:custom.settings.globalNamespace}'
```

## Write assembly plugin

Write the assembly plugin to participate in the [Solution Assembly](/development/solution-assembly) process.

- Create a `lib` directory under the `assembly` package.
  We will keep the assembly plugins code under this directory.

From the root of the project

```bash
cd components/project-s3-buckets/packages/assembly
mkdir -p lib
```

- Create a plugin to merge the file fragments we just created above to the `backend` deployment unit.
  Create `backend.js` file with the following contents under the `lib` directory you just created.
  The `getMergeCfnYmlsTaskPlugin` function used in the code below takes care of merging the YML files to the target `backend` deployment unit.
  The function can merge plain yaml files or yaml files containing AWS CloudFormation syntax.

```javascript
import path from 'path';

import { getMergeCfnYmlsTaskPlugin } from '@aws-ee/base-assembly-tasks';

const backendOverridesDir = path.normalize(path.join(__dirname, '../assets/overrides/backend'));
const mergeYamlsPlugin = getMergeCfnYmlsTaskPlugin(backendOverridesDir);

export default [mergeYamlsPlugin];
```

- If the component has multiple assembly plugins, we can wrap them all using a `wrapAssemblyPlugins` function and export one single plugin as follows.
  Create a wrapper `assembly-plugin.js` file under the `lib` directory.

```javascript
import { wrapAssemblyPlugins } from '@aws-ee/base-assembly-tasks';

import backendAssemblyPlugins from './backend';

const plugin = wrapAssemblyPlugins([...backendAssemblyPlugins]);

export default plugin;
```

- Finally, create a file named `index.js`, under the `lib` directory, to export the wrapper assembly plugin and the individual
  assembly plugins. We will import this plugin to add it to the plugin-registry when integrating this component to the rest of
  the project.

```javascript
import plugin from './assembly-plugin';

export { default as backendAssemblyPlugins } from './backend';

export default plugin;
```
