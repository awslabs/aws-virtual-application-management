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

### Separately Deployable Components (SDCs)
- [backend](assets/main/solution/backend/README.md)

### Extension Points
TODO

### Plugins  
TODO

# Installation
See [installation instructions](./INSTALLATION.md) for details 
