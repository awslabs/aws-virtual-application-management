# @aws-ee/base-auth-cognito-post-deployment

This package provides `base-auth-cognito` component plugins for use in the Post Deployment deployable stack.

## Plugins

The following plugins are provided for use in the `post-deployment` Lambda function:

- `authentication-provisioner-plugin` - Provides logic for setting up Cognito as an authentication provider within the solution
- `services-plugin` - Registers services required by the plugins
- `user-management-plugin` - Adds functionality to the base `UserService` so that users can be managed within the Cognito user pool provided by this component
