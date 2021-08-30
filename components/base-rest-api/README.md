# Component Base Rest APIs

This is the base rest api component which provides code for setting up basic infrastructure for building APIs using
Amazon API Gateway and AWS Lambda functions. The component provides a base API handler Lambda function that uses

## Component Dependencies

See [component.yml](./component.yml) for component dependencies (i.e., other components this component depends on).

## Component Contributions

The component adds (contributes) the followings

### Directory structure

The component does not contribute any additional directories to the top level project directory.

### Component Packages

The component provides the following NPM packages

- [api-handler-factory](./packages/api-handler-factory/README.md)
- [base-api-handler](./packages/base-api-handler/README.md)
- [base-authn-handler](./packages/base-authn-handler/README.md)
- [base-controllers](./packages/base-controllers/README.md)
- [post-deployment-steps](./packages/post-deployment-steps/README.md)
- [services](./packages/services/README.md)

### Deployable Units

- [backend](assets/main/solution/backend/README.md)

### Extension Points

TODO: add the other extension points

#### Extension for Users

This component adds the `users` extension point, which allows you to add new user roles and user capabilities to the solution.

To create a user plugin for this extension point, create a file in your components plugin directory called `users-plugin.js`.

You can find an example in the base users plugin `users-plugin.js` file located at `$PROJECT_HOME/components/base-rest-api/packages/post-deployment-steps/lib/plugins/users-plugin.js`.

Next, you need to add it to your post-deployment component `plugin-registry.js` file:

```javascript
import baseUsersPlugin from '@aws-ee/post-deployment-steps';
import usersPlugin from './users-plugin';

const extensionPoints = {
   ...
  'users': [baseUsersPlugin, usersPlugin],
};

```

##### User Roles

By default, the solution has two basic roles: Admin and Guest.
An Admin user has full access to all of the solutions features.
A Guest user will start off with no explicit access to any feature.

In the base users plugin file, you can see a commented example on how to add a custom user role. If you follow that example to register a new role, it will be created the next time the solution is deployed.

##### User Capabilities

By default, the Admin user will have all capabilities assigned to it. Every time a new capability is added, it will be automatically added to the Admin user upon deployment
when the `autoSyncUserRoleCapabilities` setting is `true`. If it is set to false, then the capability will manually need to be added to the target user role in DynamoDB.

You can set a capability to a target user role as shown in the base user plugin example. Using this functionality you can set a list of capabilities to a user role upon deployment provided that the
`autoSyncUserRoleCapabilities` setting is `true`.

### Plugins

TODO

## Installation

See [installation instructions](./INSTALLATION.md) for details
