# EventBridge Services

## Services

### eventbridge-service

Used to make API calls to the AWS EventBridge service.

Supported methods:

- createRule
- deleteRule
- createRuleTarget
- deleteRuleTarget
- publishEvent

All methods take `requestContext`, a `rawEvent` for which schemas can be found under `./lib/eventbridge/schema/api/`, and an extra parameter to target a specific event bus.
If no event bus is specified in the calling of each method, then the solution-wide bus is used.

### eventbridge-schema-service

Used to collect all event types and schemas defined via plugins in this solution.

Supported methods:

- getJsonSchemaCatalog

### schema-container

This utility class helps instantiate the EventBridge schema service and call all plugins to build the schema catalog.
This class is intended to be used in scenarios where the service container does not exist and has not been initialized.
Example: When referencing schemas from CloudFormation template code via Serverless Framework `file()` variables.

## The common solution wide schema

The base template for the common schema is defined in `./lib/eventbridge/schema/eventbridge/eventbus-common-template.json`.
This base template is enhanced via the plugins through the `detail-type` and `details` fields.
