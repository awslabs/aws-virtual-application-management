# Component EventBridge

This EventBridge component supports the following use-cases:

- Support a solution-level event bus to be used in common by all components
- A common solution-wide schema for all events using this bus
- A mechanism for components to contribute definitions to the solution-wide schema or other namespaced schemas
- A service that facilitates event publishing, rule and target registration and deletion

## Component Dependencies

See [component.yml](./component.yml) for component dependencies (i.e., other components this component depends on).

## Component Contributions

- A separate deployable unit for EventBridge infrastructure containing at least one solution wide bus and one solution wide schema registry for the bus
- A service to allow for event publishing, rule and target creation and deletion
- Extension point to contribute event type schema definitions

### Directory structure

The component adds a new deployable unit in the `main/solution` folder called `eventbridge-infra`.

### Component Packages

The component provides the following NPM packages

- [eventbridge-services](./packages/eventbridge-services/README.md)

### Deployable Units

- [eventbridge-infra](./assets/eventbridge-infra/README.md)

### Extension Points

This component provides an extension point for plugins to contribute new event schemas to the common schema registry.

- `eventbridge` - allows schema definition contributions

Example registration:

```javascript
const helloWorldEventBridgePlugin = require("services/lib/plugins/eventbridge-plugin");

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

module.exports = registry;
```

Example plugin function:

```javascript
const eventType1 = require("../hello-eventbridge/schema/event-type-1.part");
const eventType2 = require("../hello-eventbridge/schema/event-type-2.part");

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

module.exports = plugin;
```

Example global schema part definition:

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

The above registration will result in the schema at `addons/addon-eventbridge/packages/eventbridge-services/lib/schema/eventbridge/eventbus-common-template.json`
to be enhanced with the plugin definitions above and registered in the global and registered on the common solution registry.

### Plugins

See example in Extension Points above.

## Installation

See [installation instructions](./INSTALLATION.md) for details
