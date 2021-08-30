# Component Base UI

This is the base UI component which provides code for setting up basic infrastructure for building project
User Interface (UI) and hosting the UI as static website using Amazon S3.
In tandem with a (required) hosting component (base-ui-public-hosting or base-ui-private-hosting) it also provides
means to serve the static website assets via HTTPS.

## Component Dependencies

See [component.yml](./component.yml) for component dependencies (i.e., other components this component depends on).

## Component Contributions

The component adds (contributes) the followings

### Directory structure

The component does not contribute any additional directories to the top level project directory.

### Component Packages

The component provides the following NPM packages
- [base-ui](./packages/base-ui/README.md)
- [docs](./packages/docs/README.md)
- [serverless-ui-tools](./packages/serverless-ui-tools/README.md)

### Deployable Units

- [web-infra](assets/main/solution/web-infra/README.md)
- [ui](assets/main/solution/ui/README.md)

### Extension Points

TODO

### Plugins

TODO

# Installation

See [installation instructions](./INSTALLATION.md) for details
