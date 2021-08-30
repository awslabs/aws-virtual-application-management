# @aws-ee/base-auth-cognito-backend

This package provides `base-auth-cognito` component plugins for use in the Backend deployable stack.

## `api-handler` Plugins

The following plugins are provided for use in the `api-handler` Lambda function:

- `authentication-provider-plugin` - Provides methods for handling Cognito as an `authentication-provider` resource within the base REST APIs
- `services-plugin` - Registers services required by the plugins
- `user-management-plugin` - Adds functionality to the base `UserService` so that users can be managed within the Cognito user pool provided by this component

## `authn-handler` Plugins

The following plugins are provided for use in the `api-handler` Lambda function:

- `services-plugin` - Registers services required by the plugins
- `user-management-plugin` - Adds functionality to the base `UserService` so that users can be managed within the Cognito user pool provided by this component
