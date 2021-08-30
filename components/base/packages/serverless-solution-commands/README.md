# @aws-ee/base-serverless-docs-tools <!-- omit in toc -->

- [Prerequisites](#prerequisites)
  - [Tools](#tools)
  - [Project structure](#project-structure)
- [Usage](#usage)
  - [`sls solution-build`](#sls-solution-build)
  - [`sls solution-unit-test`](#sls-solution-unit-test)
  - [`sls solution-integration-test`](#sls-solution-integration-test)
  - [`sls solution-lint`](#sls-solution-lint)
  - [`sls solution-package`](#sls-solution-package)
  - [`sls solution-deploy`](#sls-solution-deploy)
  - [`sls solution-info`](#sls-solution-info)
  - [`sls solution-remove`](#sls-solution-remove)
  - [`sls --help`](#sls---help)
  - [`sls <custom-command>`](#sls-custom-command)

## Prerequisites

### Tools

- [AWS CLI](https://aws.amazon.com/cli/)
- [Git CLI](https://git-scm.com/downloads)
- [Node.js 12+](https://nodejs.org/en/download/)
- [pnpm](https://pnpm.js.org/en/installation)
- [Serverless Framework](https://www.serverless.com/framework/docs/providers/aws/guide/installation/)

### Project structure

This [Serverless Framework plugin](https://www.serverless.com/framework/docs/providers/aws/guide/plugins/) depends on the package named `@aws-ee/base-script-utils`.
The plugin expects the host directory (the one importing this plugin) to have a `plugin-registry.js` at `scripts/plugins/plugin-registry.js`.

The plugin registry is expected to provide an object containing `getPlugins` method that accepts a name of one of
the following extension points and returns a list of plugin objects.

```javascript
const extensionPoints = {
  commands: [], // An array of plugins to contribute Serverless commands that can be executed as "pnpx sls <your-command>"
  package: [], // An array of plugins that implement "package" method. These plugins will be invoked when "pnpx sls solution-package" is executed
  deploy: [], // An array of plugins that implement "deploy" method. These plugins will be invoked when "pnpx sls solution-deploy" is executed
  info: [], // An array of plugins that implement "getInfo" method. These plugins will be invoked when "pnpx sls solution-info" is executed
  remove: [], // An array of plugins that implement "getInfo" method. These plugins will be invoked when "pnpx sls solution-remove" is executed
};

function getPlugins(extensionPoint) {
  return extensionPoints[extensionPoint];
}

const registry = {
  getPlugins,
};

module.exports = registry;
```

## Usage

When installed as a [Serverless plugin](https://serverless.com/framework/docs/providers/aws/guide/plugins/), this provides the following CLI commands:

### `sls solution-build`

Builds all packages of the solution i.e., all packages that are part of the PNPM workspace.

### `sls solution-unit-test`

Runs unit tests for all packages of the solution i.e., all packages that are part of the PNPM workspace.

### `sls solution-integration-test`

Runs integration tests for all packages of the solution i.e., all packages that are part of the PNPM workspace.

### `sls solution-lint`

Runs static code analysis i.e., lint npm script for all packages of the solution (all packages that are part of the PNPM workspace)

### `sls solution-package`

Invokes the `package` method of all the plugins which are registered against the extension point `package` in the `scripts/plugins/plugin-registry.js` file.
If plugins from all child Serverless Framework Projects (i.e., all the deployable units) of the solution are registered then this command will package all deployable units of the solution.

### `sls solution-deploy`

Invokes the `deploy` method of all the plugins which are registered against the extension point `deploy` in the `scripts/plugins/plugin-registry.js` file.
If plugins from all child Serverless Framework Projects (i.e., all the deployable units) of the solution are registered then this command will deploy all deployable units of the solution.

### `sls solution-info`

Invokes the `info` method of all the plugins which are registered against the extension point `info` in the `scripts/plugins/plugin-registry.js` file.
These plugins are given a chance to contribute to an "info" Map. The information contributed by all the plugins is finally printed in a tabular format on the console.

### `sls solution-remove`

Invokes the `remove` method of all the plugins which are registered against the extension point `remove` in the `scripts/plugins/plugin-registry.js` file.
If plugins from all child Serverless Framework Projects (i.e., all the deployable units) of the solution are registered then this command will remove (undeploy) all deployable units of the solution.

### `sls --help`

Run `sls --help | grep "solution-"` to view the above mentioned usage information about all the commands starting with prefix `"solution-"`

### `sls <custom-command>`

In addition to the above mentioned commands, this Serverless Framework Plugin allows other plugins registered to the `commands` extension point to contribute their own commands and/or implementation for any other commands.
Any additional commands contributed by such plugins can then be invoked using `sls <custom-command>`. For example, if a plugin contributed a command named `welcome` then it can be executed as `sls welcome` (or `pnpx sls welcome`)
