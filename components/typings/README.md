# Component Typings

This Typings component provides TypeScript definition files (`*.d.ts`) for a number of SST packages. These definition files provide:

- Better auto-complete for JS development.
- Enable TypeScript development in SST based PoCs.

## Component Dependencies

See [component.yml](./component.yml) for component dependencies (i.e., other components this component depends on).

## Component Contributions

- This component does not contribute any features.

Note that using a TS definition is a nice-to-have for JavaScript development because most IDEs (VSCode included) can make use of it for auto-completion and type checking. See [installation instructions](./INSTALLATION.md) on how to add a type reference to a package.
Also note, that most of these definitions are auto-generated and therefore not very good yet.

### Component Packages

The component provides the following NPM packages
- base
    - `@types/aws-ee__base-assembly-tasks`
    - `@types/aws-ee__base-services`
    - `@types/aws-ee__base-services-container`
- base-rest-api
    - `@types/aws-ee__base-api-handler-factory`
    - `@types/aws-ee__base-controllers`
- base-workflow
    - `@types/aws-ee__base-workflow-core`
    - `@types/aws-ee__workflow-engine`

Each package provides typings for the source package of the matching name, for example `@types/aws-ee__base-services` provides typings for `@aws-ee/base-services`. This naming follows the [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) convention and has the advantage that the `tsconfig.json` does not need any special configuration to pick up typings.

### Separately Deployable Components (SDCs)

N/A

### Extension Points

N/A

### Plugins

N/A

## Installation

See [installation instructions](./INSTALLATION.md) for details
