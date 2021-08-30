The steps below assume that you have already installed the component's dependencies. See [component.yml](./component.yml) file for dependencies of this component.

The steps below refers to the top level directory containing your project code as `$PROJECT_HOME`.

Before you start installing the workflow-api component, make sure you have installed base-workflow component.

1. Add this component as a git submodule named "base-workflow-api":

   ```bash
   $ cd $PROJECT_HOME/components
   $ git submodule add <git url to this component> base-workflow-api
   ```

2. Register `base-workflow-api` plugins with the appropriate backend registries

   2.1 Modify the `$PROJECT_HOME/main/packages/registry-backend/lib/api-handler/plugin-registry.js` file:

   - Add to imports:

     ```javascript
     import { baseWfServicesPlugin, baseWfRoutesPlugin } from '@aws-ee/base-workflow-api';
     ```

   - Add to `extensionPoints.service`:

     ```javascript
     baseWfServicesPlugin,
     ```

   - Add to `extensionPoints.route`:

     ```javascript
     baseWfRoutesPlugin,
     ```

     2.2 Modify the `$PROJECT_HOME/main/packages/registry-backend/package.json` file:

   ```json
   "dependencies": {
     ...
     "@aws-ee/base-workflow-api": "workspace:*",
   }
   ```

3. Install dependencies

   ```bash
   $ cd $PROJECT_HOME
   $ pnpm install -r
   ```

4. Add the assembly entries for the documentation for the component

   4.1. Modify the `$PROJECT_HOME/main/packages/registry-docs/package.json` file:

   - Add to `dependencies`:

     ```json
       "@aws-ee/base-workflow-api": "workspace:*",
     ```

     4.2. Modify the `$PROJECT_HOME/main/packages/registry-docs/lib/plugin-registry.js` file:

   - Add to imports:

     ```javascript
     import { docsPlugin as baseWorkflowApiDocsPlugin } from '@aws-ee/base-workflow-api';
     ```

   - Add to `extensionPoints.docs`:

     ```javascript
       baseWorkflowApiDocsPlugin,
     ```

5. Deploy the solution

   ```bash
   $ pnpx sls solution-deploy --stage $STAGE_NAME
   ```
