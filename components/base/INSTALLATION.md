# Installation Steps

The steps below assume that this is the first component you are installing for your project and you do not have
your project directory structure created yet.

1. Create a directory for your project. The steps below refers to this directory as `$PROJECT_HOME`.

2. Create a `components` directory under the `$PROJECT_HOME` directory for holding all components including this base component.

3. Add this component as `base` GitSubmodule to your project under the `components` directory.

   ```
   $ cd $PROJECT_HOME/components
   $ git submodule add <git url to this component> base
   ```

4. Copy the component's assets.

   ```
   $ cd $PROJECT_HOME
   $ cp -r components/base/packages/assembly/assets/boilerplate/* .
   ```

   This will create few files under the `$PROJECT_HOME` directory and also create the `$PROJECT_HOME/main` directory, and the basic folder structure under that directory.

5. Create a settings (configuration) file for the project environment.
   The project environment name is also referred to as the "stage" name (e.g., `dev`, `qa`, `prod` etc).
   If you are getting started, it is a common convention to use your username on the computer as the stage name.
   The instructions below refers to the stage name as `$STAGE_NAME`

   ```
   $ cp $PROJECT_HOME/main/config/settings/example.yml $PROJECT_HOME/main/config/settings/$STAGE_NAME.yml
   ```

   Adjust the settings in the `$PROJECT_HOME/main/config/settings/$STAGE_NAME.yml` file you just created.
   Read inline comments in the file for information about each setting.

6. Optionally, create a `custom-domains` specific settings (configuration) file for the project environment.
   This is an optional step and if you do not create the settings file, the default settings that gets generated at `$PROJECT_HOME/components/base/packages/assembly/assets/deployables/custom-domains/config/settings/.defaults.yml` will be used.
   If you want to override certain settings, you can create the deployable unit specific settings override file as follows.

   ```bash
   $ cp $PROJECT_HOME/main/config/settings/custom-domains/example.yml $PROJECT_HOME/main/config/settings/custom-domains/$STAGE_NAME.yml 
   ```

   Adjust the settings in the `$PROJECT_HOME/main/config/settings/custom-domains/$STAGE_NAME.yml` file you just created.
   Read inline comments in the file for information about each setting.

7. Optionally, create a `docs` specific settings (configuration) file for the project environment.
   This is an optional step and if you do not create the settings file, the default settings that gets generated based on `$PROJECT_HOME/components/base/packages/assembly/assets/deployables/docs/config/settings/.defaults.yml` will be used.
   If you want to override certain settings, you can create the deployable unit specific settings override file as follows.

   ```bash
   $ cp `$PROJECT_HOME/components/base/packages/assembly/assets/deployables/docs/config/settings/.defaults.yml` $PROJECT_HOME/main/config/settings/docs/$STAGE_NAME.yml 
   ```

   Adjust the settings in the `$PROJECT_HOME/main/config/settings/docs/$STAGE_NAME.yml` file you just created.
   Read inline comments in the file for information about each setting.

8. You have installed the `base` component at this point. After installation of the component you can,

   - Run components' assembly to generate solution containing various deployable units.

     ```bash
     $ cd $PROJECT_HOME
     $ npm install pnpm -g
     $ pnpm install -r --frozen-lockfile
     $ pnpx sls solution-assemble
     ```

   - Generate a basic documentation website for the project.

     ```bash
     $ cd $PROJECT_HOME/main/.generated-solution/docs/
     $ pnpx sls package-ui --stage $STAGE_NAME
     # To start the documentation server locally
     $ pnpx sls start-ui --stage $STAGE_NAME
     # Press "Ctrl + C" to kill the documentation server
     ```

   - Package all deployable units of your project using following command from the `$PROJECT_HOME`

     ```bash
     $ cd $PROJECT_HOME
     $ pnpx sls solution-package --stage $STAGE_NAME
     ```

   - Install additional components. All other components depend on this `base` component and the directory structure/tools provided by the `base` component.
   - Add your project specific code to appropriate directory under `$PROJECT_HOME/main`
