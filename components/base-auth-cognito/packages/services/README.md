# @aws-ee/base-auth-cognito-services

This package defines services required by various plugins within the `base-auth-cognito` component

## Services

The following services are provided:

- `CognitoAttributeMapperService` - Maps claims found within JWTs issued by Cognito to user attributes compatible with other solution components
- `CognitoProvisionerService` - Creates and configures resources for the solution's user pool that are not already setup by the `@aws-ee/base-auth-cognito-assembly` package such as federated identity providers
- `CognitoProviderService` - Exposes methods to be executed during login/logout or for token validation
- `CognitoUserManagementService` - Provides methods for managing users within the user pool (e.g., create, update, delete, etc.)

## Plugins

The following plugins are provided:

- `user-management-plugin` - Adds functionality to the base `UserService` so that users can be managed within the Cognito user pool provided by this component
