The steps below assume that you have already installed the component's dependencies. See [component.yml](./component.yml) file for dependencies of this component.

The steps below refers to the top level directory containing your project code as `$PROJECT_HOME`.

1. Add this component as a git submodule named "base-workflow-ui":

   ```bash
   $ cd $PROJECT_HOME/components
   $ git submodule add <git url to this component> base-workflow-ui
   ```

2. Register `base-workflow-ui` plugins with the UI registry

   2.1 Modify the `$PROJECT_HOME/main/packages/registry-ui/lib/plugin-registry.js` file:

     - Add to imports:

        ```javascript
          import {
            workflowAppContextItemsPlugin,
            workflowMenuItemsPlugin,
            workflowRoutesPlugin,
          } from '@aws-ee/base-workflow-ui';
        ```

     - Add to `extensionPoints['app-context-items']`:

        ```javascript
          workflowAppContextItemsPlugin,
        ```

     - Add to `extensionPoints['menu-items']`:

        ```javascript
          workflowMenuItemsPlugin,
        ```

     - Add to `extensionPoints['routes']`:

       ```javascript
         workflowRoutesPlugin,
       ```

   2.2 Modify the `$PROJECT_HOME/main/packages/registry-ui/package.json` file:

      ```json
      "dependencies": {
        ...
        "@aws-ee/base-workflow-ui": "workspace:*",
      }
      ```

3. Register `base-workflow-ui` plugins with the docs registry

   3.1 Modify the `$PROJECT_HOME/main/packages/registry-docs/lib/plugin-registry.js` file:

     - Add to imports:

        ```javascript
         import { docsPlugin as workflowDocsPlugin } from '@aws-ee/base-workflow-ui-docs';
        ```

     - Add to `extensionPoints['docs']`:

        ```javascript
          workflowDocsPlugin,
        ```

   3.2 Modify the `$PROJECT_HOME/main/packages/registry-docs/package.json` file:

      ```json
      "dependencies": {
        ...
        "@aws-ee/base-workflow-ui-docs": "workspace:*",
      }
      ```

4. Install dependencies

    ```bash
    $ cd $PROJECT_HOME
    $ pnpm install -r
    ```

5. Deploy the solution

    ```bash
    $ pnpx sls solution-deploy --stage $STAGE_NAME
    ```
