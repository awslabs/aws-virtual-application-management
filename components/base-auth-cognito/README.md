# Component Base Auth Cognito

Owner: @kyarosh

This component provides backend and post-deployment resources that facilitate authentication through a Cognito user pool.

## Component Dependencies

See [component.yml](./component.yml) for component dependencies (i.e., other components on which this component depends).

## Component Contributions

### Directory Structure

This component does not contribute any additional directories to the top level project directory.

### Component Packages

The component provides the following NPM packages:

- [@aws-ee/base-auth-cognito-assembly](./packages/assembly/README.md)
- [@aws-ee/base-auth-cognito-backend](./packages/backend/README.md)
- [@aws-ee/base-auth-cognito-docs](./packages/docs/README.md)
- [@aws-ee/base-auth-cognito-post-deployment](./packages/post-deployment/README.md)
- [@aws-ee/base-auth-cognito-serverless-commands](./packages/serverless-commands/README.md)
- [@aws-ee/base-auth-cognito-services](./packages/services/README.md)

### Deployable Units

This component does not contribute any new deployable units.

### Extension Points

This component does not contribute any new extension points.

### Plugins

assembly:

- `assembly-plugin`

backend:

- `api-handler:`
    - `services-plugin`
    - `user-management-plugin`
- `authn-handler:`
    - `services-plugin`
    - `user-management-plugin`

docs:

- `docs-plugin`

post-deployment:

- `authentication-provisioner-plugin`
- `services-plugin`
- `user-management-plugin`

serverless-commands:

- `sls-commands-plugin`

## Installation

See [installation instructions](./INSTALLATION.md) for details.
