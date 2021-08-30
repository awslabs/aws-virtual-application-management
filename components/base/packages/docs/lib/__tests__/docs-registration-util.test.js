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

import { itProp, fc } from 'jest-fast-check';
import { registerDocs } from '../docs-registration-util';

describe('docs-registration-util', () => {
  let pluginRegistry;
  beforeEach(() => {
    pluginRegistry = {
      getPlugins: jest.fn(),
    };
  });

  itProp(
    'throws when a plugin does not return an array',
    [fc.oneof(fc.string(), fc.nat(), fc.object())],
    async (plugins) => {
      pluginRegistry.getPlugins.mockResolvedValue(plugins);

      await expect(registerDocs(pluginRegistry)).rejects.toThrow('Expecting plugins to be an array');
    },
  );

  itProp('throws when a plugin does not have the getConfiguration method', [fc.anything()], async (pluginObject) => {
    pluginRegistry.getPlugins.mockResolvedValue([pluginObject]);

    await expect(registerDocs(pluginRegistry)).rejects.toThrow(
      'All "docs" plugins must implement a "getConfiguration" method',
    );
  });

  it('throws when a plugin adds an unexpected property to configSoFar', async () => {
    const getConfiguration = jest.fn();
    pluginRegistry.getPlugins.mockResolvedValue([{ getConfiguration }]);

    getConfiguration.mockImplementation(async () => {
      return {
        docusaurusConfig: {},
        pagesPaths: [],
        sidebarsConfig: {
          docs: [],
        },
        staticFilesPaths: [],
        controllerConfigs: [],
        foo: {},
      };
    });

    await expect(registerDocs(pluginRegistry)).rejects.toThrow(
      'All "docs" plugins must implement a getConfiguration method which does not add unexpected properties (foo)',
    );
  });

  it('registers the docs when no plugins exist', async () => {
    pluginRegistry.getPlugins.mockResolvedValue([]);

    const result = await registerDocs(pluginRegistry);

    expect(result).toEqual({
      docusaurusConfig: {},
      pagesPaths: [],
      sidebarsConfig: {
        docs: [],
      },
      staticFilesPaths: [],
      controllerConfigs: [],
    });
  });

  describe('with provided plugin', () => {
    let getConfiguration;
    beforeEach(() => {
      getConfiguration = jest.fn();
      pluginRegistry.getPlugins.mockResolvedValue([{ getConfiguration }]);
    });
    const value = 'Value';
    const mockValue = `mock${value}`;

    it('registers values as expected (except sidebars)', async () => {
      getConfiguration.mockImplementation(async (configSoFar, _pluginRegistry, settings) => {
        return {
          ...configSoFar,
          pagesPaths: [...configSoFar.pagesPaths, 'mockPath'],
          staticFilesPaths: [...configSoFar.staticFilesPaths, 'mockStaticFiles'],
          docusaurusConfig: { ...configSoFar.docusaurusConfig, mockConfig: `mock${settings.value}` },
          controllerConfigs: [...configSoFar.controllerConfigs, 'mockPath'],
        };
      });

      const result = await registerDocs(pluginRegistry, { value });

      expect(result).toEqual({
        docusaurusConfig: { mockConfig: mockValue },
        pagesPaths: ['mockPath'],
        sidebarsConfig: {
          docs: [],
        },
        staticFilesPaths: ['mockStaticFiles'],
        controllerConfigs: ['mockPath'],
      });
    });

    it('transforms sidebars', async () => {
      const sidebarsConfig = {
        'Top Level': {
          idx: 1000,
          vals: {
            'Sub Level': { idx: 1000 },
          },
        },
        'Last Level': {
          idx: 3000,
        },
        'Mid Level': {
          idx: 2000,
          vals: {
            First: { idx: 1000 },
            Last: { idx: 3000 },
            Mid: { idx: 2000 },
          },
        },
      };
      getConfiguration.mockImplementation(async (configSoFar) => {
        return {
          ...configSoFar,
          sidebarsConfig,
        };
      });

      const result = await registerDocs(pluginRegistry);

      expect(result.sidebarsConfig).toEqual({
        docs: [{ 'Top Level': ['Sub Level'] }, { 'Mid Level': ['First', 'Mid', 'Last'] }, 'Last Level'],
      });
    });
  });
});
