# Installation Steps

The steps below assume that you have already installed the component's dependencies. See [component.yml](./component.yml) file for dependencies of this component.

The steps below refers to the top level directory containing your project code as `$PROJECT_HOME`.

1.  Add this component as `eventbridge` GitSubmodule to your project under the `components` directory.
    ```bash
    $ cd $PROJECT_HOME/components
    $ git submodule add <git url to this component> eventbridge
    ```
2.  Copy the component's assets.

```bash
$ cd $PROJECT_HOME
$ cp -r components/eventbridge/packages/assembly/assets/boilerplate/* .
```

This will create the following skeleton plugin folders under `$PROJECT_HOME/main/packages/`

- registry-eventbridge-infra

3. Add `eventbridge` assembly plugins to the main assembly package's plugin registry

   3.1 In `$PROJECT_HOME/main/packages/assembly/package.json`, add following to `dependencies`

   ```json
    "@aws-ee/eventbridge-assembly": "workspace:*",
   ```

   3.2 Modify the `$PROJECT_HOME/main/packages/assembly/lib/plugin-registry.js` file

   - Add following import

  ```javascript
  import eventBridgeAssemblyPlugin from "@aws-ee/eventbridge-assembly";
  ```

  ```javascript
      const extensionPoints = {
        assemble: [
          // Other existing plugins ...
          eventBridgeAssemblyPlugin, // <-- Add this
          slsPackagePlugin,
        ],
  ```

   3.3 Modify the `$PROJECT_HOME/main/packages/main-commands/lib/plugin-registry.js` file

   - Load related plugins in the `getPluginRegistry` function

  ```javascript
  const eventBridgeInfraPackagePlugin = lazyRequire('eventbridge-infra/scripts/plugins/sls-package-plugin.js');
  const eventBridgeInfraDeployPlugin = lazyRequire('eventbridge-infra/scripts/plugins/sls-deploy-plugin.js');
  const eventBridgeInfraRemovePlugin = lazyRequire('eventbridge-infra/scripts/plugins/sls-remove-plugin.js');
  ```

  ```javascript
  switch (extensionPoint) {
    case 'package':
      return [
        // Other existing plugins ...
        eventBridgeInfraPackagePlugin(),// <-- Add this
        slsPackagePlugin,
      ];
    case 'deploy':
      return [
        // Other existing plugins ...
        eventBridgeInfraDeployPlugin(), // <-- Add this. Make sure this is added BEFORE all deployable units that need to use it so that it gets deployed before the other deployable units that depend on it.
        slsDeployPlugin,
      ];
    case 'remove':
      return [
        // Other existing plugins ...
        eventBridgeInfraRemovePlugin(), // <-- Add this. Make sure this is AFTER all deployable units that need to use it so that it is undeployed after the other deployable units that depend on it.
        slsRemovePlugin,
      ];
  };
   ```
   
4. Register plugins on the "api-handler" Lambda function:

  - In `$PROJECT_HOME/main/packages/registry-backend/package.json`, add following to `dependencies`

   ```json
      "@aws-ee/eventbridge-services": "workspace:*",
   ```

  - Modify `$PROJECT_HOME/main/packages/registry-backend/lib/api-handler/plugin-registry.js`:
    - Add to imports:

        ```javascript
        import { servicesPlugin as eventBridgeServicesPlugin } from '@aws-ee/eventbridge-services';
        ```

    - Add to `extensionPoints.service`:
      ```javascript
      eventBridgeServicesPlugin,
      ```

5. Install dependencies
   ```bash
   $ cd $PROJECT_HOME
   $ pnpm install -r --frozen-lockfile
   ```

6. You have installed the `eventbridge-infra` component at this point. After installation of the component you can, re-deploy the whole solution as follows.

   - Run components' assembly to generate solution containing various deployable units.

     ```bash
     $ cd $PROJECT_HOME
     $ pnpx sls solution-assemble
     ```

   - Deploy the solution

   ```bash
   $ pnpx sls solution-deploy --stage $STAGE_NAME
   ```

# Extras

## Adding new event type schemas

Here are provided steps to create and register new event types as part of the solution based on the `helloworld` repository.

1. Create your new schema parts.

For this example, they are created as:

`$PROJECT_HOME/main/packages/services/lib/hello-eventbridge/schema/event-type-1.part.json`

```json
{
  "detail": {
    "type": "object",
    "properties": {
      "field1": {
        "type": "string"
      },
      "field2": {
        "type": "string"
      }
    }
  }
}
```

and

`$PROJECT_HOME/main/packages/services/lib/hello-eventbridge/schema/event-type-2.part.json`

```json
{
  "detail": {
    "type": "object",
    "properties": {
      "field3": {
        "type": "string"
      },
      "field4": {
        "type": "string"
      }
    }
  }
}
```

2. Register them as extensions to the EventBridge component.

For this example, the file `$PROJECT_HOME/main/packages/services/lib/plugins/eventbridge-plugin.js` has been created with the following contents:

```javascript
import eventType1 from "../hello-eventbridge/schema/event-type-1.part.json";
import eventType2 from "../hello-eventbridge/schema/event-type-2.part.json";

const getDetailSchemas = async (schemaContributionsMapSoFar) => {
  schemaContributionsMapSoFar.eventType1 = {
    detailType: "eventType1",
    detailSchema: eventType1,
  };

  schemaContributionsMapSoFar.eventType2 = {
    detailType: "eventType2",
    detailSchema: eventType2,
  };

  return schemaContributionsMapSoFar;
};

const plugin = { getDetailSchemas };

export default plugin;
```

3. Register the plugin in the EventBridge Infrastructure deployable unit.

The file `$PROJECT_HOME/main/solution/eventbridge-infra/src/plugins/plugin-registry.js` has been updated to look like this:

```javascript
import helloWorldEventBridgePlugin from "services/dist/plugins/eventbridge-plugin";

const extensionPoints = {
  service: [],
  eventbridge: [helloWorldEventBridgePlugin],
};

async function getPlugins(extensionPoint) {
  return extensionPoints[extensionPoint];
}

const registry = {
  getPlugins,
};

export default registry;
```

4. Deploy the solution or the EventBridge Infrastructure deployable unit

After deployment, in your target AWS account in EventBridge, under the Schema Registry for the common solution bus, the two new schemas should appear.
