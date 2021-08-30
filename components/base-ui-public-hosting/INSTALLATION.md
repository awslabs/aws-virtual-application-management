# Installation Steps

The steps below assume that you have already installed the component's dependencies. See [component.yml](./component.yml) file for dependencies of this component.

The steps below refers to the top level directory containing your project code as `$PROJECT_HOME`.

1. Add this component as `base-ui-public-hosting` GitSubmodule to your project under the `components` directory.

   ```bash
   $ cd $PROJECT_HOME/components
   $ git submodule add <git url to this component> base-ui-public-hosting
   ```

2. Add `base-ui-public-hosting` assembly plugins to the main assembly package's plugin registry
   2.1 In `$PROJECT_HOME/main/packages/assembly/package.json`, add following to `dependencies`

   ```json
    "@aws-ee/base-ui-public-hosting-assembly": "workspace:*",
   ```

   2.2 Modify the `$PROJECT_HOME/main/packages/assembly/lib/plugin-registry.js` file

   - Add following import

   ```javascript
   import baseUiPublicHostingAssemblyPlugin from '@aws-ee/base-ui-public-hosting-assembly';
   ```

   ```javascript
   const extensionPoints = {
     assemble: [
       baseAssemblyPlugin,
       basePostDeploymentAssemblyPlugin,
       baseRestApiAssemblyPlugin,
       baseUiPublicHostingAssemblyPlugin, // <-- Add this after baseRestApiAssemblyPlugin and before all other plugins
       // Other existing plugins ...
     ],
   ```

   2.3 Modify the `$PROJECT_HOME/main/packages/main-commands/lib/plugin-registry.js` file

   - Load post-deployment related plugins in the `getPluginRegistry` function

   ```javascript
   const edgeLambdaPackagePlugin = lazuRequire('edge-lambda/scripts/plugins/sls-package-plugin.js');
   const edgeLambdaDeployPlugin = lazyRequire('edge-lambda/scripts/plugins/sls-deploy-plugin.js');
   const edgeLambdaRemovePlugin = lazyRequire('edge-lambda/scripts/plugins/sls-remove-plugin.js');
   ```

   ```javascript
   switch (extensionPoint) {
     case 'package':
       return [
         // Other existing plugins ...
         edgeLambdaPackagePlugin(), // <-- Add this
         slsPackagePlugin,
       ];
     case 'deploy':
       return [
         // Other existing plugins ...
         backendDeployPlugin(),
         edgeLambdaDeployPlugin(), // <-- Add this after backendDeployPlugin
         postDeploymentDeployPlugin(),
         slsDeployPlugin,
       ];
     case 'remove':
       return [
         postDeploymentRemovePlugin(),
         edgeLambdaRemovePlugin(), // <-- Add this right after postDeploymentRemovePlugin
         // Other existing plugins ...
         slsRemovePlugin,
       ];
   }
   ```

3. Optionally, create `edge-lambda` deployable unit specific settings file for the project environment.

   ```bash
   $ cp `$PROJECT_HOME/components/base-ui-public-hosting/packages/assembly/assets/deployables/edge-lambda/config/settings/.defaults.yml` $PROJECT_HOME/main/config/settings/edge-lambda/$STAGE_NAME.yml
   ```

   Adjust the settings in the `$PROJECT_HOME/main/config/settings/edge-lambda/$STAGE_NAME.yml` file you just created.
   Read inline comments in the file for information about each setting.

4. Configure the Post-Deployment Steps provided by the `base-ui-public-hosting` component:

   - Add dependency on `@aws-ee/base-ui-public-hosting-post-deployment-steps` to the `dependencies` in the `$PROJECT_HOME/main/packages/registry-post-deployment/package.json`

   ```json
      "@aws-ee/base-ui-public-hosting-post-deployment-steps": "workspace:*"
   ```

   - Register the plugins provided by the `base-ui-public-hosting` component to the plugin registry. Modify `$PROJECT_HOME/main/packages/registry-post-deployment/lib/plugin-registry.js` as follows

     ```javascript
     import {
       servicesPlugin as baseUiPublicHostingServicesPlugin,
       stepsPlugin as baseUiPublicHostingStepsPlugin,
     } from '@aws-ee/base-ui-public-hosting-post-deployment-steps';

     const extensionPoints = {
       service: [
         // existing plugins,
         baseUiPublicHostingServicesPlugin, // <-- Add this
         servicesPlugin,
       ],
       postDeploymentStep: [
         // existing plugins,
         baseUiPublicHostingStepsPlugin, // <-- Add this
         stepsPlugin,
       ],
     };
     ```

5. Register `base-ui-public-hosting-docs` plugins with the docs registry

   4.1 Modify the `$PROJECT_HOME/main/packages/registry-docs/lib/plugin-registry.js` file:

   - Add to imports:

     ```javascript
     import { docsPlugin as baseUiPublicHostingDocs } from '@aws-ee/base-ui-public-hosting-docs';
     ```

   - Add to `extensionPoints['docs']` before `docsPlugin`:

     ```javascript
       baseUiPublicHostingDocs,
     ```

     4.2 Modify the `$PROJECT_HOME/main/packages/registry-docs/package.json` file:

   ```json
     "dependencies": {
       ...
       "@aws-ee/base-ui-public-hosting-docs": "workspace:*",
     }
   ```

6. Install dependencies

   ```bash
   $ cd $PROJECT_HOME
   $ pnpm install -r --frozen-lockfile
   ```

7. You have installed the `base-ui-public-hosting` component at this point. After installation of the component you can,

- Run components' assembly to generate solution containing various deployable units.

  ```bash
  $ cd $PROJECT_HOME
  $ pnpx sls solution-assemble
  ```

8. You have installed the `base-ui-public-hosting` component at this point. After installation of the component you can, re-deploy the whole solution and access the solution UI as follows.

   - Deploy the solution

   ```bash
   $ pnpx sls solution-deploy --stage $STAGE_NAME
   ```

   This step may take longer to complete (15-20 minutes) the first time you deploy because it will create Amazon CloudFront distribution (via `web-infra`) and AWS Lambda@Edge (via `edge-lambda`).
   Creating these resources take longer the first time.

   - Once the deployment is complete, navigate to the Website URL printed in the output in a web browser to access the solution user interface (UI).
