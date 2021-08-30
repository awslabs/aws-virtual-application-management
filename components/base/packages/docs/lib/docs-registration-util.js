/*
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 * http://aws.amazon.com/apache2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

import _ from 'lodash';

/**
 * Utilitiy function to transform an object into a proper Docusaurus sidebar object (see https://v2.docusaurus.io/docs/docs-introduction/#sidebar-object)
 *
 * Each proprty of the source object is expected to have an 'idx' sub-property itself. The source object is converted into an array, one element per property,
 * whereby its elements are ordered by 'idx' sub-property.
 *
 * If a property has a 'suppress' sub-property that evaluates to truthy value, it is omited.
 *
 * If a property of the source object has a 'vals' sub-property, it is transformed into an object with a single property, similarly keyed, valued as the result of
 * applying this transformation recursively on the 'vals' sub-property. Otherwise, its key is returned as a string.
 */
function transformSidebarConfig(config) {
  // filter out undefined (supporessed entries)
  return _.filter(
    // do the transform
    _.map(
      // sort by idx
      _.orderBy(
        // convert to array of objects
        _.map(config, (value, key) => {
          // push key downward into object
          return { ...value, key };
        }),
        // field to order by
        'idx',
      ),
      // the actual transform
      (element) => {
        if (element.suppress) return undefined;
        if (!_.has(element, 'vals')) return element.key;
        const result = {};
        _.set(result, element.key, transformSidebarConfig(element.vals));
        return result;
      },
    ),
    // predicate to filter by
    _.negate(_.isUndefined),
  );
}

/**
 * Utility function to collect Docusaurus configuration, by calling each docs plugin in order.
 *
 * @param {getPlugins} pluginRegistry A registry that provides plugins registered by various add-ons for the specified extension point.
 * Each 'docs' plugin in the returned array is an object containing "getConfiguration" method.
 *
 * @returns {Promise<void>}
 */
async function registerDocs(pluginRegistry, settings) {
  // Get all services plugins from the services plugin registry
  // Each plugin is an object with a "getConfiguration" method
  const extensionPoint = 'docs';
  const plugins = await pluginRegistry.getPlugins(extensionPoint);
  if (!_.isArray(plugins)) {
    throw new Error('Expecting plugins to be an array');
  }
  const expectedMethod = 'getConfiguration';
  const pluginsWithoutMethod = _.filter(plugins, (plugin) => !_.isFunction(_.get(plugin, expectedMethod)));
  if (pluginsWithoutMethod.length > 0) {
    throw new Error(`All "${extensionPoint}" plugins must implement a "${expectedMethod}" method`);
  }

  // Collect configuration from all plugins.
  //
  // Ask each plugin to contribute to the Docusaurus configuration.
  // Each plugin is passed an object containing Docusaurus configuration of the format:
  //
  // {
  //   pagesPaths: {String[]} - Array of absolute path strings where MDX Markdown pages can be found (see https://v2.docusaurus.io/docs/creating-pages#routing)
  //   staticFilesPaths: {String[]} - Array of absolute path strings where static assets can be found (see https://v2.docusaurus.io/docs/static-assets)
  //   docusaurusConfig: {Object} - Docusaurus configuration object (see https://v2.docusaurus.io/docs/configuration#what-goes-into-a-docusaurusconfigjs)
  //   sidebarsConfig: {Object} - Composed proto Docusaurus sidebar object (see the 'transformSidebarConfig' function above)}
  //   controllerConfig: {Object[]} - Array of config objects, which include filePath specifying JS where OpenAPI documentation can be found in JSDoc (see https://www.npmjs.com/package/swagger-jsdoc)
  //
  // Each plugin may choose to override any of these properties.
  // The plugins are called in the same order as returned by the registry.
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

  configMap.sidebarsConfig = {
    docs: transformSidebarConfig(configMap.sidebarsConfig),
  };
  return configMap;
}

export { registerDocs };
