# Installation Steps

The steps below assume that you have already installed the component's dependencies. See [component.yml](./component.yml) file for dependencies of this component.

The steps below refers to the top level directory containing your project code as `$PROJECT_HOME`.

1. Add this component as `base-scripts` GitSubmodule to your project under the `components` directory.
    ```bash
    $ cd $PROJECT_HOME/components
    $ git submodule add <git url to this component> base-scripts
    ```
   
2. Copy the component's assets.
    ```bash
    $ cd $PROJECT_HOME
    $ cp -r components/base-scripts/assets/* .
    ```
   This will create the new `scripts` directories under `$PROJECT_HOME/`.

3. If you haven't created already, create a settings (configuration) file for the project environment.
   The project environment name is also referred to as the "stage" name (e.g., `dev`, `qa`, `prod` etc).
   If you are getting started, it is a common convention to use your username on the computer as the stage name.
   The instructions below refers to the stage name as `$STAGE_NAME`
    ```
    $ cp $PROJECT_HOME/main/config/settings/example.yml $PROJECT_HOME/main/config/settings/$STAGE_NAME.yml
    ```
   Adjust the settings in the `$PROJECT_HOME/main/config/settings/$STAGE_NAME.yml` file you just created.
   Read inline comments in the file for information about each setting.

4. You have installed the `base-scripts` component at this point. After installation of the component you can,
    - `$PROJECT_HOME/scripts/environment-deploy.sh $STAGE_NAME` script to deploy the whole project.   
    - See other scripts provided by this component under `$PROJECT_HOME/scripts` directory. 