The steps below assume that you have already installed the component's dependencies. See [component.yml](./component.yml) file for dependencies of this component.

The steps below refers to the top level directory containing your project code as `$PROJECT_HOME`.

1. Add this component as a git submodule named "base-workflow":

   ```bash
   $ cd $PROJECT_HOME/components
   $ git submodule add <git url to this component> base-workflow
   ```

2. Copy the component's assets.

   ```bash
   $ cd $PROJECT_HOME
   $ cp -r components/base-workflow/packages/assembly/assets/boilerplate/* .
   ```

   This will create the following skeleton plugin files/folders under `$PROJECT_HOME/main/packages/`

   - registry-backend/lib/workflow-loop-runner/
   - registry-backend/lib/workflow-solution-events-handler/

3. Add `base-workflow` assembly plugins to the main assembly package's plugin registry
   
   3.1 In `$PROJECT_HOME/main/packages/assembly/package.json`, add the following to `dependencies`

      ```json
         "@aws-ee/base-workflow-assembly": "workspace:*"
      ```

   3.2 Modify the `$PROJECT_HOME/main/packages/assembly/lib/plugin-registry.js` file:

   - Add following import

      ```javascript
      import baseWorkflowAssemblyPlugin from "@aws-ee/base-workflow-assembly";
      ```

   - Load related plugins in the `getPluginRegistry` function

      ```javascript
      const extensionPoints = {
        assemble: [
          // Other existing plugins ...
          baseWorkflowAssemblyPlugin, // <-- Add this
          datasetUiAssemblyPlugin,
        ],
      };
      ```

4. Register `base-workflow` plugins with the appropriate backend registries

   4.1 Modify the `$PROJECT_HOME/main/packages/registry-backend/lib/index.js` file:

      ```javascript
        import workflowRunnerPluginRegistry from './workflow-loop-runner/plugin-registry';
        import workflowEventsHandlerPluginRegistry from './workflow-solution-events-handler/plugin-registry';
        ...
        export {
          ...
          workflowRunnerPluginRegistry,
          workflowEventsHandlerPluginRegistry,
        }
      ```

   4.2 Modify the `$PROJECT_HOME/main/packages/registry-backend/package.json` file:

      ```json
      "dependencies": {
        ...
        "@aws-ee/base-workflow-core": "workspace:*",
        "@aws-ee/base-workflow-steps": "workspace:*",
      }
      ```

5. Register `base-workflow` plugins with the post deployment registry

   5.1 Modify the `$PROJECT_HOME/main/packages/registry-post-deployment/lib/plugin-registry.js` file:

     - Add to imports:

        ```javascript
          import { servicesPlugin as eventBridgeServicesPlugin } from '@aws-ee/eventbridge-services';
          import { workflowServicesPlugin, workflowPostDeploymentStepsPlugin } from '@aws-ee/base-workflow-core';
          import { baseWfStepsPlugin } from '@aws-ee/base-workflow-steps';
          import { baseWfTemplatesPlugin } from '@aws-ee/base-workflow-templates';
        ```

      - Add to `extensionPoints.service`:

        ```javascript
        workflowServicesPlugin,
        eventBridgeServicesPlugin,
        ```

      - Add to `extensionPoints.postDeploymentStep`:

        ```javascript
        workflowPostDeploymentStepsPlugin,
        ```

      - Add to `extensionPoints.workflow-steps`:

        ```javascript
        baseWfStepsPlugin,
        ```

      - Add to `extensionPoints.workflow-templates`:

        ```javascript
        baseWfTemplatesPlugin,
        ```

   5.2 Modify the `$PROJECT_HOME/main/packages/registry-post-deployment/package.json` file:

      ```json
      "dependencies": {
        ...
        "@aws-ee/base-workflow-core": "workspace:*",
        "@aws-ee/base-workflow-steps": "workspace:*",
        "@aws-ee/base-workflow-templates": "workspace:*",
        "@aws-ee/eventbridge-services": "workspace:*",
      }
      ```

6. Install dependencies

    ```bash
    $ cd $PROJECT_HOME
    $ pnpm install -r
    ```

7. Assemble the component

    ```bash
    $ cd $PROJECT_HOME
    $ pnpx sls solution-assemble -s $STAGE_NAME
    ```

8. Deploy the solution

    ```bash
    $ pnpx sls solution-deploy --stage $STAGE_NAME
    ```
