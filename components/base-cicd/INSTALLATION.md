# Installation Steps

The steps below assume that you have already installed the component's dependencies. See [component.yml](./component.yml) file for dependencies of this component.

The steps below refers to the top level directory containing your project code as `$PROJECT_HOME`.

1. Add this component as `base-cicd` GitSubmodule to your project under the `components` directory.

   ```bash
   $ cd $PROJECT_HOME/components
   $ git submodule add <git url to this component> base-cicd
   ```

2. Copy the component's assets.

   ```bash
   $ cd $PROJECT_HOME
   $ cp -r components/base-cicd/packages/assembly/assets/boilerplate/* .
   ```

   - This will create the following directories under `$PROJECT_HOME/main/config/settings` with example settings files.

     - main/config/settings/cicd-pipeline/
     - main/config/settings/cicd-target/

   - This will also add the following top level buildspec file under `$PROJECT_HOME`
     - buildspec-components.yml

3. Add `cicd` to pnpm workspace.

   - Modify file `$PROJECT_HOME/pnpm-workspace.yaml` and add `main/.generated-solution/cicd/*` to the list of packages

     ```yaml
     packages:
       # ...Other packages
       - main/.generated-solution/cicd/*
     ```

4. Add `base-cicd` assembly plugins to the main assembly package's plugin registry
   4.1 In `$PROJECT_HOME/main/packages/assembly/package.json`, add following to `dependencies`

   ```json
    "@aws-ee/base-cicd-assembly": "workspace:*"
   ```

   4.2 Modify the `$PROJECT_HOME/main/packages/assembly/lib/plugin-registry.js` file

   - Add following import

   ```javascript
   import cicdAssemblyPlugin from '@aws-ee/base-cicd-assembly';
   ```

   ```javascript
   const extensionPoints = {
     assemble: [
       // Other existing plugins ...
       cicdAssemblyPlugin,  // <-- Add this
     ];
   ```

   4.3 Modify the `$PROJECT_HOME/main/packages/main-commands/lib/plugin-registry.js` file

   - Load related plugins in the `getPluginRegistry` function

   ```javascript
   const cicdPipelinePlugin = lazyRequireIfExists('cicd/cicd-pipeline/scripts/plugins/sls-commands-plugin.js');
   const cicdPipelineInfoPlugin = lazyRequire('cicd/cicd-pipeline/scripts/plugins/sls-info-plugin.js');
   const cicdTargetPlugin = lazyRequireIfExists('cicd/cicd-target/scripts/plugins/sls-commands-plugin.js');
   const cicdTargetInfoPlugin = lazyRequire('cicd/cicd-target/scripts/plugins/sls-info-plugin.js');
   const cicdUtilsPlugin = lazyRequireIfExists('cicd/cicd-utils/scripts/plugins/sls-commands-plugin.js');
   ```

   ```javascript
   switch (extensionPoint) {
     case 'commands':
       return [
         // Other existing plugins ...
         cicdPipelinePlugin(), // <-- Add this
         cicdTargetPlugin(), // <-- Add this
         cicdUtilsPlugin(), // <-- Add this
       ];
     case 'info':
       return [
         // Other existing plugins ...
         cicdPipelineInfoPlugin(), // <-- Add this
         cicdTargetInfoPlugin(), // <-- Add this
       ];
   }
   ```

5. Optionally, create a `CICD` related settings (configuration) files for the project environment.

   - If you are using AWS CodeCommit
     
     - Create settings file for the `cicd-pipeline`.
       
     ```bash
     $ cp $PROJECT_HOME/main/config/settings/cicd-pipeline/example-codecommit.yml $PROJECT_HOME/main/config/settings/cicd-pipeline/$STAGE_NAME.yml
     ```
     
     - Create settings file for the `cicd-target`.
       
     ```bash
     $ cp $PROJECT_HOME/main/config/settings/cicd-target/example-codecommit.yml $PROJECT_HOME/main/config/settings/cicd-target/$STAGE_NAME.yml
     ```

   - If you are using GitHub
     
     - Create settings file for the `cicd-pipeline`.
       
     ```bash
     $ cp $PROJECT_HOME/main/config/settings/cicd-pipeline/example-github.yml $PROJECT_HOME/main/config/settings/cicd-pipeline/$STAGE_NAME.yml
     ```
     
     - Create settings file for the `cicd-target`.
       
     ```bash
     $ cp $PROJECT_HOME/main/config/settings/cicd-target/example-codecommit.yml $PROJECT_HOME/main/config/settings/cicd-target/$STAGE_NAME.yml
     ```

     Adjust the settings in the `$STAGE_NAME.yml` files you just created in `$PROJECT_HOME/main/config/settings/cicd-pipeline` and `$PROJECT_HOME/main/config/settings/cicd-target` directories.
     Read inline comments in the files for information about each setting.

6. Install dependencies

   ```bash
   $ cd $PROJECT_HOME
   $ pnpm install -r --frozen-lockfile
   ```

7. You have installed the `base-cicd` component at this point. After installation of the component you can,

   - Run components' assembly to generate solution containing various deployable units.

     ```bash
     $ cd $PROJECT_HOME
     $ pnpx sls solution-assemble
     ```

   - Deploy CI/CD pipeline for your project.
     See [cicd readme](CICD-README.md) file for information about deploying the CI/CD pipeline.
