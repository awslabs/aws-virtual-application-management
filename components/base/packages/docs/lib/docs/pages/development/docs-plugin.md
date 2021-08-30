---
id: docs-plugin
title: Docs Plugin
sidebar_label: Docs Plugin
---

### Docs Plugin

The Docs plugin assembles all the documentation for the application into a single Docusaurus site. It does this by requiring every component that is to be documented to register a `docsPlugin` within `main/packages/registry-docs/lib/plugin-registry.js`. The `docsPlugin` must contain a `getConfiguration` function, which is passed an object containing Docusaurus configuration:

- `pagesPaths: {String[]}` - Array of absolute path strings where MDX Markdown pages can be found ([see](https://v2.docusaurus.io/docs/creating-pages#routing))
- `staticFilesPaths: {String[]}` - Array of absolute path strings where static assets can be found ([see](https://v2.docusaurus.io/docs/static-assets))
- `docusaurusConfig: {Object}` - Docusaurus configuration object ([see](https://v2.docusaurus.io/docs/configuration#what-goes-into-a-docusaurusconfigjs))
- `sidebarsConfig: {Object}` - Composed proto Docusaurus sidebar object (see the 'transformSidebarConfig' function above)}
- `controllerConfig: {Object[]}` - Array of config objects, which include filePath specifying JS where OpenAPI documentation can be found in JSDoc ([see](https://www.npmjs.com/package/swagger-jsdoc))

Each plugin may choose to override any of these properties. For example, a TODO list management feature might override `pagesPaths` and `sidebarsConfig` to contribute its documentation to the docs pages and sidebar:

```javascript
import _ from 'lodash';
import path from 'path';
import sidebarsConfig from '../docs/sidebars';

const getConfiguration = async (configSoFar) => {
  return {
    ...configSoFar,
    pagesPaths: [...configSoFar.pagesPaths, path.resolve(__dirname, '../docs/pages')],
    sidebarsConfig: _.merge(configSoFar.sidebarsConfig, sidebarsConfig),
  };
};
```

Plugins can also contribute API documentation via the `getConfiguration`. For example, a TODO list management feature could register its controllers and JSON validation schema, which are subsequently processed

```javascript
import path from 'path';
import createTodo from '@aws-ee/todo-management-services/lib/schema/create-todo.json';
import updateTodo from '@aws-ee/todo-management-services/lib/schema/update-todo.json';
import deleteTodo from '@aws-ee/todo-management-services/lib/schema/delete-todo.json';

function getControllerConfigs(controllerConfigsSoFar) {
  const filePath = path.resolve(__dirname, '../controllers/**/*.js');
  const schemas = {
    createTodo,
    updateOrganization,
    updateTodo,
    deleteTodo,
  };
  return [...controllerConfigsSoFar, { filePath, schemas }];
}

async function getConfiguration(configSoFar) {
  const updatedConfig = {
    ...configSoFar,
    controllerConfigs: getControllerConfigs(configSoFar.controllerConfigs),
  };
  return updatedConfig;
}
```

The `getConfiguration` functions are called by `registerDocs` in `components/base/packages/docs/lib/docs-registration-util.js`:

```javascript
const configMap = await _.reduce(
  plugins,
  async (configSoFarPromise, plugin) => {
    const configSoFar = await configSoFarPromise;
    const configUpdated = await plugin.getConfiguration(configSoFar, pluginRegistry, settings);
    const unexpectedProperties = _.difference(_.keys(configUpdated), _.keys(configSoFar));
    if (!_.isEmpty(unexpectedProperties))
      throw new Error(
        `All "${extensionPoint}" plugins must implement a getConfiguration method which does not add unexpected properties (${unexpectedProperties})`,
      );
    return configUpdated;
  },
  Promise.resolve({
    pagesPaths: [],
    staticFilesPaths: [],
    docusaurusConfig: {},
    sidebarsConfig: {},
    controllerConfigs: [],
  }),
);
```

The `registerDocs` function is then called by `ServerlessDocsToolsPlugin` in `components/base/packages/serverless-docs-tools/lib/index.js`; the ServerlessDocsToolsPlugin

- writes page data to the files used by Docusaurus
- registers OpenAPI data for use by Docusaurus
- starts the Docusaurus server
