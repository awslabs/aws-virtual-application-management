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
import { ServicesContainer } from '@aws-ee/base-services-container';
import { PluginRegistryService } from '@aws-ee/base-services';
import EventBridgeSchemaService from '../eventbridge-schema-service';
import SettingsServiceMock from '../../__mocks__/settings-service.mock';

describe('EventBridgeSchemaService', () => {
  let sut;
  let logServiceMock;

  describe('getJsonSchemaCatalog - no plugins', () => {
    beforeEach(async () => {
      const container = new ServicesContainer();

      logServiceMock = {
        initService: jest.fn(),
        error: jest.fn(),
      };

      container.register('log', logServiceMock);
      container.register('settings', new SettingsServiceMock({}));
      container.register('pluginRegistryService', new PluginRegistryService({ getPlugins: () => [] }), { lazy: false });

      container.register('sut', new EventBridgeSchemaService());

      await container.initServices();
      sut = await container.find('sut');
    });

    it('no plugins', async () => {
      const schemaCatalog = await sut.getJsonSchemaCatalog();

      expect(schemaCatalog).toMatchObject({});
    });
  });

  describe('getJsonSchemaCatalog - with plugins', () => {
    const customNamespace = 'customNamespace';

    const eventType1 = 'eventType1';
    const eventType2 = 'eventType2';
    const eventType3 = 'eventType3';

    const plugin1 = {
      getDetailSchemas: soFar => {
        const thisPlugin = {
          [eventType1]: {
            detailType: eventType1,
            detailSchema: 'detailSchema1',
          },
        };

        return _.merge(soFar, thisPlugin);
      },
    };

    const plugin2 = {
      getDetailSchemas: soFar => {
        const thisPlugin = {
          [eventType2]: {
            detailType: eventType2,
            detailSchema: 'detailSchema2',
          },
        };

        return _.merge(soFar, thisPlugin);
      },
    };

    const plugin3 = {
      getDetailSchemas: soFar => {
        const thisPlugin = {
          [eventType3]: {
            detailType: eventType3,
            detailSchema: 'detailSchema3',
            schemaNamespace: customNamespace,
          },
        };

        return _.merge(soFar, thisPlugin);
      },
    };

    beforeEach(async () => {
      const container = new ServicesContainer();

      logServiceMock = {
        initService: jest.fn(),
        error: jest.fn(),
      };

      container.register('log', logServiceMock);
      container.register('settings', new SettingsServiceMock({}));

      container.register(
        'pluginRegistryService',
        new PluginRegistryService({
          getPlugins: () => [plugin1, plugin2, plugin3],
        }),
        { lazy: false },
      );

      container.register('sut', new EventBridgeSchemaService());

      await container.initServices();
      sut = await container.find('sut');
    });

    it('no plugins', async () => {
      const schemaCatalog = await sut.getJsonSchemaCatalog();

      expect(schemaCatalog.solution.length).toBe(2);
      expect(schemaCatalog[customNamespace].length).toBe(1);

      schemaCatalog.solution.forEach(eventSchema => {
        expect([eventType1, eventType2]).toContain(eventSchema.eventType);
        expect([eventType1, eventType2]).toContain(_.first(_.get(eventSchema, 'schema.properties.detailType.enum')));
      });

      const customNamespaceSchema = _.first(schemaCatalog[customNamespace]);
      expect(customNamespaceSchema.eventType).toBe(eventType3);
      expect(_.first(_.get(customNamespaceSchema, 'schema.properties.detailType.enum'))).toBe(eventType3);
    });
  });
});
