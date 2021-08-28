# Component Base CI/CD

This is the base ci/cd pipeline component which provides a continuous integration and continuous delivery pipeline for a project built using `ee-component-base`, `ee-component-base-post-deployment`, `ee-component-base-rest-api`, `ee-component-base-ui`, and `ee-component-base-scripts` components.

## Component Dependencies

See [component.yml](./component.yml) for component dependencies (i.e., other components this component depends on).

## Component Contributions

The component adds (contributes) the followings.

### Directory structure

The component does not contribute any additional directories to the top level project directory.

### Component Packages

The component does not add any packages.

### Deployable Units

The component adds the following deployable units under the `main` directory

- [cicd/cicd-target](packages/assembly/assets/deployables/cicd/cicd-target/README.md)
- [cicd/cicd-pipeline](packages/assembly/assets/deployables/cicd/cicd-pipeline/README.md)
- [cicd/cicd-utils](packages/assembly/assets/deployables/cicd/cicd-utils/README.md)

### Extension Points

TODO

### Plugins

TODO

# Installation

See [installation instructions](./INSTALLATION.md) for details

# Usage

See [CI/CD instructions](./CICD-README.md) for details about how to deploy and use the CI/CD pipeline
