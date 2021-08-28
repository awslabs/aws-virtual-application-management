# Installation Steps

The steps below assume that you have already installed the component's dependencies. See [component.yml](./component.yml) file for dependencies of this component.

The steps below refers to the top level directory containing your project code as `$PROJECT_HOME`.

1. Add this component as `base-ui` GitSubmodule to your project under the `components` directory.

   ```bash
   $ cd $PROJECT_HOME/components
   $ git submodule add <git url to this component> base-ui
   ```

2. Copy the component's assets.

   ```bash
   $ cd $PROJECT_HOME
   $ cp -r components/base-ui/packages/assembly/assets/boilerplate/* .
   ```

   This will create the following skeleton packages under `$PROJECT_HOME/main/packages/`

   - `registry-ui`

3. Add `base-ui` assembly plugins to the main assembly package's plugin registry
   3.1 In `$PROJECT_HOME/main/packages/assembly/package.json`, add following to `dependencies`

  ```json
  "@aws-ee/base-ui-assembly": "workspace:*",
  ```

   3.2 Modify the `$PROJECT_HOME/main/packages/assembly/lib/plugin-registry.js` file

   - Add following import

  ```javascript
  import baseUiAssemblyPlugin from "@aws-ee/base-ui-assembly";
  ```

  ```javascript
  const extensionPoints = {
    assemble: [
      baseAssemblyPlugin,
      basePostDeploymentAssemblyPlugin,
      baseRestApiAssemblyPlugin,
      baseUiAssemblyPlugin, // <-- Add this after baseRestApiAssemblyPlugin and before all other plugins
      // Other existing plugins ...
    ],
  };
  ```

   3.3 Modify the `$PROJECT_HOME/main/packages/main-commands/lib/plugin-registry.js` file

   - Load post-deployment related plugins in the `getPluginRegistry` function

  ```javascript
  const webInfraPackagePlugin = lazyRequire('web-infra/scripts/plugins/sls-package-plugin.js');
  const webInfraDeployPlugin = lazyRequire('web-infra/scripts/plugins/sls-deploy-plugin.js');
  const webInfraInfoPlugin = lazyRequire('web-infra/scripts/plugins/sls-info-plugin.js');
  const webInfraRemovePlugin = lazyRequire('web-infra/scripts/plugins/sls-remove-plugin.js');

  const uiPackagePlugin = lazyRequire('ui/scripts/plugins/sls-package-plugin.js');
  const uiDeployPlugin = lazyRequire('ui/scripts/plugins/sls-deploy-plugin.js');
  ```

  ```javascript
  switch (extensionPoint) {
    case 'package':
      return [
        // Other existing plugins ...
        webInfraPackagePlugin(), // <-- Add this
        uiPackagePlugin(), // <-- Add this
        slsPackagePlugin,
      ];
    case 'deploy':
      return [
        customDomainsDeployPlugin(),
        webInfraDeployPlugin(), // <-- Add this after customDomainsDeployPlugin and before all other plugins
        backendDeployPlugin(),
        postDeploymentDeployPlugin(),
        uiDeployPlugin(), // <-- Add this after postDeploymentDeployPlugin
        slsDeployPlugin,
      ];
    case 'info':
      return [
        webInfraInfoPlugin() // <-- Add this
        // Other existing plugins ...
        slsInfoPlugin,
      ];
    case 'remove':
      return [
        postDeploymentRemovePlugin(),
        webInfraRemovePlugin(), // <-- Add this right before customDomainsDeployPlugin
        customDomainsRemovePlugin(),
        // Other existing plugins ...
        slsRemovePlugin,
      ];
   };
   ```

4. Optionally, create a `web-infra` specific settings (configuration) file for the project environment.
   This is an optional step and if you do not create the settings file, the default settings that gets generated based on `$PROJECT_HOME/components/base-ui/packages/assembly/assets/deployables/web-infra/config/settings/.defaults.yml` will be used.
   If you want to override certain settings, you can create the deployable unit specific settings override file as follows.

   ```bash
   $ cp `$PROJECT_HOME/components/base-ui/packages/assembly/assets/deployables/web-infra/config/settings/.defaults.yml` $PROJECT_HOME/main/config/settings/web-infra/$STAGE_NAME.yml
   ```

   Adjust the settings in the `$PROJECT_HOME/main/config/settings/web-infra/$STAGE_NAME.yml` file you just created.
   Read inline comments in the file for information about each setting.

5. Similarly, you can optionally create `ui` specific settings file for the project environment.

   ```bash
   $ cp `$PROJECT_HOME/components/base-ui/packages/assembly/assets/deployables/ui/config/settings/.defaults.yml` $PROJECT_HOME/main/config/settings/ui/$STAGE_NAME.yml
   ```

   Adjust the settings in the `$PROJECT_HOME/main/config/settings/ui/$STAGE_NAME.yml` file you just created.
   Read inline comments in the file for information about each setting.

6. Configure the documentation plugins provided by the `base-ui` component:
   6.1 In `$PROJECT_HOME/main/packages/registry-docs/package.json`, add following to `dependencies`
    ```json
    "@aws-ee/base-ui-docs": "workspace:*"
   ```

   6.2 Modify `$PROJECT_HOME/main/packages/registry-docs/lib/plugin-registry.js`

   ```javascript
   import { docsPlugin as baseUiDocsPlugin } from '@aws-ee/base-ui-docs';

   const extensionPoints = {
     docs: [
       // existing plugins
       baseUiDocsPlugin, // <-- Add this plugin
       docsPlugin,
     ],
   };
   ```

7. Install dependencies

   ```bash
   $ cd $PROJECT_HOME
   $ pnpm install -r --frozen-lockfile
   ```

8. Install a UI hosting component
    In your project you need to have a hosting component too, such as `base-ui-public-hosting` or `base-ui-private-hosting`, to provide a way to serve the UI assets.
