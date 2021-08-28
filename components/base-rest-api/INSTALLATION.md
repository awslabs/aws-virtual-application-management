# Installation Steps

The steps below assume that you have already installed the component's dependencies. See [component.yml](./component.yml) file for dependencies of this component.

The steps below refers to the top level directory containing your project code as `$PROJECT_HOME`.

1. Add this component as `base-rest-api` GitSubmodule to your project under the `components` directory.

   ```bash
   $ cd $PROJECT_HOME/components
   $ git submodule add <git url to this component> base-rest-api
   ```

2. Copy the component's assets.

   ```bash
   $ cd $PROJECT_HOME
   $ cp -r components/base-rest-api/packages/assembly/assets/boilerplate/* .
   ```

   This will create the following skeleton packages under `$PROJECT_HOME/main/packages/`

   - `main-controllers`
   - `registry-backend`

3. Add `base-rest-api` assembly plugins to the main assembly package's plugin registry
   3.1 In `$PROJECT_HOME/main/packages/assembly/package.json`, add following to `dependencies`

   ```json
    "@aws-ee/base-rest-api-assembly": "workspace:*"
   ```

   3.2 Modify the `$PROJECT_HOME/main/packages/assembly/lib/plugin-registry.js` file

   - Add following import

  ```javascript
  import baseRestApiAssemblyPlugin from '@aws-ee/base-rest-api-assembly';
  ```

  ```javascript
  const extensionPoints = {
    assemble: [
      baseAssemblyPlugin,
      basePostDeploymentAssemblyPlugin,
      baseRestApiAssemblyPlugin, // <-- Add this
      // Other existing plugins ...
    ],
  };
  ```

   3.3 Modify the `$PROJECT_HOME/main/packages/main-commands/lib/plugin-registry.js` file

   - Load related plugins in the `getPluginRegistry` function

  ```javascript
  const backendPackagePlugin = lazyRequire('backend/scripts/plugins/sls-package-plugin.js');
  const backendDeployPlugin = lazyRequire('backend/scripts/plugins/sls-deploy-plugin.js');
  const backendInfoPlugin = lazyRequire('backend/scripts/plugins/sls-info-plugin.js');
  const backendRemovePlugin = lazyRequire('backend/scripts/plugins/sls-remove-plugin.js');
  ```

  ```javascript
  switch (extensionPoint) {
    case 'commands':
      return [
        // Other existing plugins ...
        slsCommandsPlugin,
      ];
    case 'package':
      return [
      // Other existing plugins ...
        backendPackagePlugin(), // <-- Add this
        postDeploymentPackagePlugin(),
        slsPackagePlugin,
      ];
    case 'deploy':
      return [
        // Other existing plugins ...
        backendDeployPlugin(), // <-- Add this
        postDeploymentDeployPlugin(),
        slsDeployPlugin,
      ];
    case 'info':
      return [
        // Other existing plugins ...
        backendInfoPlugin(), // <-- Add this
        slsInfoPlugin,
      ];
    case 'remove':
      return [
        postDeploymentRemovePlugin(), // <-- Make sure this one stays as the first plugin here
        // Other existing plugins ...
        backendRemovePlugin(), // <-- Add this
        slsRemovePlugin,
      ];
  };
  ```

4. Optionally, create a `backend` specific settings (configuration) file for the project environment.
   This is an optional step and if you do not create the settings file, the default settings that gets generated based on `$PROJECT_HOME/components/base-rest-api/packages/assembly/assets/deployables/backend/config/settings/.defaults.yml` will be used.
   If you want to override certain settings, you can create the deployable unit specific settings override file as follows.

   ```bash
   $ cp `$PROJECT_HOME/components/base-rest-api/packages/assembly/assets/deployables/backend/config/settings/.defaults.yml` $PROJECT_HOME/main/config/settings/backend/$STAGE_NAME.yml
   ```

   Adjust the settings in the `$PROJECT_HOME/main/config/settings/backend/$STAGE_NAME.yml` file you just created.
   Read inline comments in the file for information about each setting.

5. Add `base-rest-api` post-deployment plugins to the main post-deployment registry package

   3.1 In `$PROJECT_HOME/main/packages/registry-post-deployment/package.json`, add following to `dependencies`

   ```json
    "@aws-ee/base-api-post-deployment-steps": "workspace:*"
   ```

   3.2 Modify the `$PROJECT_HOME/main/packages/registry-post-deployment/lib/plugin-registry.js` file

   - Add following import

   ```javascript
   import {
     servicesPlugin as baseApisServicesPlugin,
     stepsPlugin as baseApisStepsPlugin,
     usersPlugin as baseUsersPlugin,
   } from '@aws-ee/base-api-post-deployment-steps';
   ```

   - Specify the plugins in the `extensionPoints` as follows

   ```javascript
   const extensionPoints = {
     service: [
       // existing plugins
       baseApisServicesPlugin, // <-- Add this
       servicesPlugin,
     ],
     postDeploymentStep: [
       // existing plugins
       baseApisStepsPlugin, // <-- Add this
       stepsPlugin,
     ],
     users: [
       // <-- Add this if it does not exist
       // existing plugins
       baseUsersPlugin, // <-- Add this
     ],
   };
   ```

6. Install dependencies

   ```bash
   $ cd $PROJECT_HOME
   $ pnpm install -r --frozen-lockfile
   ```

7. Add the assembly entries for the documentation for the component

   7.1. Modify the `$PROJECT_HOME/main/packages/registry-docs/package.json` file:

   - Add to `dependencies`:

     ```json
       "@aws-ee/base-controllers": "workspace:*",
     ```

     7.2. Modify the `$PROJECT_HOME/main/packages/registry-docs/lib/plugin-registry.js` file:

   - Add to imports:

     ```javascript
     import { docsPlugin as baseControllersDocsPlugin } from '@aws-ee/base-controllers';
     ```

   - Add to `extensionPoints.docs`:

     ```javascript
       baseControllersDocsPlugin,
     ```

8. You have installed the `base-rest-api` component at this point. After installation of the component you can,

- Run components' assembly to generate solution containing various deployable units.

  ```bash
  $ cd $PROJECT_HOME
  $ pnpx sls solution-assemble
  ```

- Deploy the `backend` that provides few basic REST APIs implemented using Amazon API Gateway and AWS Lambda functions. See [backend readme](./packages/assembly/assets/deployables/backend/README.md) file for information about deploying the backend.

- Re-deploy the `post-deployment` and execute the post-deployment steps as mentioned in `$PROJECT_HOME/main/.generated-solution/post-deployment/README.md`

- Alternatively, you can deploy the whole solution and all its existing deployable units using the `solution-deploy` command as follows:

```bash
$ pnpx sls solution-deploy --stage $STAGE_NAME
```

# Extras

## Updating existing backend stacks
Because of the way DynamoDB handles encryption, you may run into issues if trying to apply newer encryption changes to existing backend stacks. There are two ways to specify default encryption on a DDB table:

1. Don't specify it at all (implicitly use the default encryption)
2. Add `SSEEnabled: false` to the table's `SSESpecification` in Cloudformation (explicitly use the default encryption). 

Note that this field name is a bit misleading - the table _does_ have server side encryption with this flag set, it just doesn't use customer-owned encryption keys. See more information in the DynamoDB docs [here](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-properties-dynamodb-table-ssespecification.html)

These two approaches are logically the same (they both encrypt tables using Amazon-owned and managed keys). However, there is an issue in Cloudformation that if you've specified encryption using approach 1, 
then you cannot apply approach 2 (which I call "explicit default"). It'll result in an error:

```
An error occurred (ValidationException) when calling the UpdateTable operation: One or more parameter values were invalid: Table is already encrypted by default
```

To get around this, follow the following steps

1. Manually (via the console or CLI) update all tables using DEFAULT encryption to use KMS, selecting the Amazon-owned KMS option. 
2. Deploy with the most recent backend stack code. At this point, you can deploy using either `useCmkDynamoDbEncryption: false`, which will revert the tables to using DEFAULT encryption in a Cloudformation-friendly way, or `useCmkDynamoDbEncryption: true`, which will generate and use customer-owned encryption keys.
