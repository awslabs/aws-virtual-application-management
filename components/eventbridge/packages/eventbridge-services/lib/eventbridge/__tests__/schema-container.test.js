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
import { SchemaContainer } from '../schema-container';

describe('SchemaContainer', () => {
  describe('getSchemas', () => {
    it('no plugins', async () => {
      const pluginRegistry = { getPlugins: () => [] };
      const sut = new SchemaContainer(pluginRegistry);

      const schemas = await sut.getSchemas('solution');

      expect(schemas).toBe('[]');
    });

    it('with plugin', async () => {
      const eventType1 = 'eventType1';
      const plugin = {
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

      const pluginRegistry = { getPlugins: () => [plugin] };
      const sut = new SchemaContainer(pluginRegistry);

      const schemas = await sut.getSchemas('solution');
      const parsedSchema = JSON.parse(schemas);
      const firstSchema = _.first(parsedSchema);
      expect(firstSchema.eventType).toBe(eventType1);
      expect(_.first(_.get(firstSchema, 'schema.properties.detailType.enum'))).toBe(eventType1);
    });
  });

  it('with plugin - custom namespace', async () => {
    const customNamespace = 'customNamespace';
    const eventType1 = 'eventType1';
    const plugin = {
      getDetailSchemas: soFar => {
        const thisPlugin = {
          [eventType1]: {
            detailType: eventType1,
            detailSchema: 'detailSchema1',
            schemaNamespace: customNamespace,
          },
        };

        return _.merge(soFar, thisPlugin);
      },
    };

    const pluginRegistry = { getPlugins: () => [plugin] };
    const sut = new SchemaContainer(pluginRegistry);

    const schemas = await sut.getSchemas(customNamespace);
    const parsedSchema = JSON.parse(schemas);
    const firstSchema = _.first(parsedSchema);
    expect(firstSchema.eventType).toBe(eventType1);
    expect(_.first(_.get(firstSchema, 'schema.properties.detailType.enum'))).toBe(eventType1);
  });

  describe('getSchemasAsCloudFormationResources', () => {
    it('no plugins', async () => {
      const pluginRegistry = { getPlugins: () => [] };
      const sut = new SchemaContainer(pluginRegistry);

      const cfTemplate = await sut.getSchemasAsCloudFormationResources('solution');

      expect(cfTemplate).toMatchObject({ Resources: {} });
    });

    it('with plugin', async () => {
      const eventType1 = 'eventType1';
      const plugin = {
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

      const pluginRegistry = { getPlugins: () => [plugin] };
      const sut = new SchemaContainer(pluginRegistry);

      const cfTemplate = await sut.getSchemasAsCloudFormationResources('solution');
      expect(cfTemplate).toMatchObject({
        Resources: {
          SchemaSolutionEventType1: {
            Type: 'AWS::EventSchemas::Schema',
            Properties: {
              SchemaName: 'EventType1',
              RegistryName: { Ref: 'SolutionEventBusRegistry' },
              Type: 'JSONSchemaDraft4',
            },
          },
        },
      });

      const schemaJson = _.get(cfTemplate, 'Resources.SchemaSolutionEventType1.Properties.Content');
      const schema = JSON.parse(schemaJson);
      expect(_.get(schema, 'properties.detailType.enum[0]')).toBe(eventType1);
    });
  });
});
