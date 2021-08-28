# Component Base

This is the base component which sets up the basic directory structure for the project and provides few common packages
and tools as follows. All other components depend on this `base` component.

# Terms

- **Project**: A software application you are building using the components.
- **Deployable Units**: The base component assumes that the project is built using [Serverless Framework](https://www.serverless.com/framework/docs/).
  The project is deployed by deploying various Serverless Framework projects called deployable units.
- **Component Packages**: The base component (and all other components) contain various programming language specific library packages.
  These packages are called **Component Packages**. The base component provides few NodeJs (NPM) packages as mentioned below.
- **Extension Point**: TODO
- **Plugin**: TODO

## Component Dependencies

The component does not depend on any other component

## Component Contributions

The component adds (contributes) the followings

### Directory structure

The component creates the following directory structure for the project where it is installed

```

|-- main <-- The main directory to keep project specific code
    |-- config <-- The directory for the project to keep the top level settings/configuration files.
                   The configuration files at this level apply to all deployable units of the project.
    |-- integration-tests <-- The directory for keeping the project specific automated integration tests.
    |-- packages <-- The directory for keeping project specific library packages i.e., the library packages not
                     provided by installed components but any additional library packages you build specific
                     to the project.
    |-- solution <-- The top level directory to keep all the deployable units for this project.
```

### Component Packages

The component provides the following NPM packages

- [docs](packages/docs/README.md)
- [serverless-backend-tools](packages/serverless-backend-tools/README.md)
- [serverless-docs-tools](packages/serverless-docs-tools/README.md)
- [serverless-settings-helper](packages/serverless-settings-helper/README.md)
- [services](packages/services/README.md)
- [services-container](packages/services-container/README.md)

### Deployable Units
- [docs](packages/assembly/assets/deployables/docs/README.md)

### Extension Points

TODO

### Plugins

TODO

## Installation

See [installation instructions](./INSTALLATION.md) for details
