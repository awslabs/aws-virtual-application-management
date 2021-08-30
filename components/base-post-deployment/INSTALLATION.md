# Installation Steps

The steps below assume that you have already installed the component's dependencies. See [component.yml](./component.yml) file for dependencies of this component.

The steps below refers to the top level directory containing your project code as `$PROJECT_HOME`.

1. Add this component as `base-post-deployment` GitSubmodule to your project under the `components` directory.

   ```bash
   $ cd $PROJECT_HOME/components
   $ git submodule add <git url to this component> base-post-deployment
   ```

2. Copy the component's assets.

   ```bash
   $ cd $PROJECT_HOME
   $ cp -r components/base-post-deployment/packages/assembly/assets/boilerplate/* .
   ```
  This will create the new skeleton package directory `$PROJECT_HOME/main/packages/registry-post-deployment`. You can add post-deployment steps from other components in this package.

3. Add `post-deployment` assembly plugins to the main assembly package's plugin registry
   5.1 In `$PROJECT_HOME/main/packages/assembly/package.json`, add following to `dependencies`

   ```javascript
   "@aws-ee/base-post-deployment-assembly": "workspace:*"
   ```

   5.2 Modify the `$PROJECT_HOME/main/packages/assembly/lib/plugin-registry.js` file

   - Add following import

  ```javascript
  import {
    basePostDeploymentAssemblyPlugin,
    basePostDeploymentBackendAssemblyPlugin
  } from "@aws-ee/base-post-deployment-assembly";
  ```

  ```javascript
  const extensionPoints = {
    assemble: [
       baseAssemblyPlugin,
       basePostDeploymentAssemblyPlugin, // <-- Add this
       // ...
       basePostDeploymentBackendAssemblyPlugin, // <-- Add this AFTER plugins that initialize the backend stack
       // Other existing plugins ...
    ];
  ```

   5.3 Modify the `$PROJECT_HOME/main/packages/main-commands/lib/plugin-registry.js` file

   - Load post-deployment related plugins in the `getPluginRegistry` function

  ```javascript
  const postDeploymentPackagePlugin = lazyRequire("post-deployment/scripts/plugins/sls-package-plugin.js" );
  const postDeploymentDeployPlugin = lazyRequire("post-deployment/scripts/plugins/sls-deploy-plugin.js");
  const postDeploymentRemovePlugin = lazyRequire("post-deployment/scripts/plugins/sls-remove-plugin.js");

  ```

  ```javascript
  switch (extensionPoint) {
    case 'package':
      return [
        // Other existing plugins ...
        postDeploymentPackagePlugin(), // <-- Add this
        slsPackagePlugin,
      ];
    case 'deploy':
      return [
        // Other existing plugins ...
        postDeploymentDeployPlugin(), // <-- Add this
        slsDeployPlugin,
      ];
    case 'remove':
      return [
        postDeploymentRemovePlugin(), // <-- Add this, make sure this one is the first plugin in this list
        // Other existing plugins ...
        slsRemovePlugin,
      ];
  };
  ```

     3.1 Add the following settings to the top level settings file `$PROJECT_HOME/main/config/settings/$STAGE_NAME.yml` and adjust the values.

   ```yaml
   # Feature flag to enable/disable default encryption on DynamoDb tables via AWS owned keys
   # Customers who want to manage their own KMS keys should set this to true
   # Customers who want to use AWS-owned and managed keys should set this to false
   useCmkDynamoDbEncryption: true
   ```

4. Install dependencies

   ```bash
   $ cd $PROJECT_HOME
   $ pnpm install -r --frozen-lockfile
   ```

5. You have installed the `base-post-deployment` component at this point. After installation of the component you can,

- Run components' assembly to generate solution containing various deployable units.

  ```bash
  $ cd $PROJECT_HOME
  $ pnpx sls solution-assemble
  ```

- Deploy the `post-deployment` that creates an AWS Lambda function for performing certain tasks after the project deployment completes.
  The `base-post-deployment` just creates the post-deployment lambda function and provides extension points to plugin post-deployment steps by other components.
  The `base-post-deployment` does not contribute any post-deployment steps.  
  See [post-deployment readme](./packages/assembly/assets/deployables/post-deployment/README.md) file for information about deploying the post-deployment and executing post-deployment tasks by invoking the post-deployment Lambda function.