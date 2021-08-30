# Component Base Post Deployment
This is the base post-deployment component which provides a deployable unit for running some tasks (called post-deployment steps) in an AWS Lambda function after the project deployment. 
These post-deployment steps can be used for performing any tasks after the project deployment is complete. 
For example, a post-deployment step can be used for initializing some database tables, or performing any other arbitrary AWS resources provisioning not supported by AWS CloudFormation.       

## Component Dependencies
See [component.yml](./component.yml) for component dependencies (i.e., other components this component depends on).

## Component Contributions
The component adds (contributes) the followings

### Directory structure
The component does not contribute any additional directories to the top level project directory. 

### Component Packages
The component provides the following NPM packages
- [base-post-deployment](./packages/base-post-deployment/README.md)

### Deployable Units
- [post-deployment](assets/main/solution/post-deployment/README.md)

### Extension Points
TODO

### Plugins  
TODO

# Installation
See [installation instructions](./INSTALLATION.md) for details 
