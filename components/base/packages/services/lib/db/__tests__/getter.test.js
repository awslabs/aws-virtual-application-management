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

/* eslint-disable max-classes-per-file */
import _ from 'lodash';
import { itProp, fc } from 'jest-fast-check';
import { ServicesContainer } from '@aws-ee/base-services-container';
import DbService from '../../db-service';

class MockDynamoDB {}

class DocumentClient {}

describe('DbService.getter', () => {
  let sut;
  let logMockService;

  beforeEach(async () => {
    MockDynamoDB.DocumentClient = DocumentClient;
    const container = new ServicesContainer();
    logMockService = {
      initService: jest.fn().mockResolvedValue(),
    };
    const mockAwsService = {
      initService: jest.fn().mockResolvedValue(),
      sdk: { DynamoDB: MockDynamoDB },
    };
    container.register('aws', mockAwsService);
    container.register('log', logMockService);
    container.register('sut', new DbService());
    await container.initServices();
    sut = await container.find('sut');
  });

  describe('Getter', () => {
    let getter;
    beforeEach(() => {
      getter = sut.helper.getter();
    });

    describe.each`
      functionName    | parameterValue
      ${'table'}      | ${'mockTableName'}
      ${'key'}        | ${{}}
      ${'keys'}       | ${{}}
      ${'props'}      | ${{}}
      ${'strong'}     | ${{}}
      ${'names'}      | ${{}}
      ${'projection'} | ${'mockProjection'}
      ${'capacity'}   | ${'INDEXES'}
    `('$functionName (generic tests)', ({ functionName, parameterValue }) => {
      it('returns "this" for a fluent interface', () => {
        const result = getter[functionName](parameterValue);
        expect(result).toBe(getter);
      });
    });

    it('returns a constructed instance', () => {
      expect(getter.log).toBe(logMockService);
      expect(getter.client).toBe(sut.client);
      expect(getter.params).toEqual({});
    });

    describe('.table', () => {
      itProp('throws on non-strings', fc.anything(), tableName => {
        fc.pre(typeof tableName !== 'string');
        expect(() => getter.table(tableName)).toThrow(
          `DbGetter.table("${tableName}" <== must be a string and can not be empty).`,
        );
      });

      itProp('throws on empty strings', fc.string(), tableName => {
        fc.pre(_.isEmpty(_.trim(tableName)));
        expect(() => getter.table(tableName)).toThrow(
          `DbGetter.table("${tableName}" <== must be a string and can not be empty).`,
        );
      });

      itProp('sets the table name on valid strings', fc.string(), tableName => {
        fc.pre(!_.isEmpty(_.trim(tableName)));
        getter.table(tableName);
        expect(getter.params.TableName).toBe(tableName);
      });
    });

    describe('.key', () => {
      itProp('sets the key (key value mode)', [fc.string(), fc.anything()], (key, value) => {
        getter.key(key, value);

        expect(getter.params.Key[key]).toBe(value);
      });

      itProp('sets the key (object mode)', fc.object(), key => {
        getter.params.Key = { previous: 'value' };

        getter.key(key);

        expect(getter.params.Key).toEqual({ previous: 'value', ...key });
      });
    });

    describe('.keys', () => {
      itProp('sets the key object', fc.anything(), keys => {
        getter.keys(keys);
        expect(getter.params.Keys).toBe(keys);
      });
    });

    describe('.props', () => {
      itProp('sets the properties (key value mode)', [fc.string({ minLength: 1 }), fc.string()], (key, value) => {
        getter.params = { previous: 'value' };
        getter.props(key, value);
        expect(getter.params).toEqual({ previous: 'value', [key]: value });
      });

      itProp('sets the properties (object mode)', fc.object(), parameters => {
        getter.params = { previous: 'value' };
        getter.props(parameters);
        expect(getter.params).toEqual({ previous: 'value', ...parameters });
      });
    });

    describe('.strong', () => {
      it('sets the ConsistentRead flag', () => {
        getter.strong();
        expect(getter.params.ConsistentRead).toBe(true);
      });
    });

    describe('.names', () => {
      itProp('throws on non-empty non-objects', fc.anything(), names => {
        fc.pre(!_.isObject(names) && !_.isEmpty(names));
        expect(() => getter.names(names)).toThrow(`DbGetter.names("${names}" <== must be an object).`);
      });

      itProp('reacts gracefully to empties', fc.object(), names => {
        fc.pre(_.isEmpty(names));
        expect(() => getter.names(names)).not.toThrow();
      });

      itProp('populates attributes when previously empty', fc.object(), names => {
        fc.pre(!_.isEmpty(names));
        getter.params.ExpressionAttributeNames = undefined;
        getter.names(names);
        expect(getter.params.ExpressionAttributeNames).toEqual(names);
      });

      itProp('populates attributes when previously set', fc.object(), names => {
        fc.pre(!_.isEmpty(names));
        getter.params.ExpressionAttributeNames = { previous: 'value' };
        getter.names(names);
        expect(getter.params.ExpressionAttributeNames).toEqual({ previous: 'value', ...names });
      });
    });

    describe('.projection', () => {
      itProp('throws on non-empty non-strings/arrays', fc.anything(), expr => {
        fc.pre(!_.isString(expr) && !_.isArray(expr) && !_.isEmpty(expr));
        expect(() => getter.projection(expr)).toThrow(
          `DbGetter.projection("${expr}" <== must be a string or an array).`,
        );
      });

      itProp('reacts gracefully to empties', fc.anything(), expr => {
        fc.pre(_.isEmpty(expr));
        expect(() => getter.projection(expr)).not.toThrow();
      });

      itProp('sets the expression string when previously empty', fc.string(), expr => {
        fc.pre(!_.isEmpty(expr));
        getter.params.ProjectionExpression = undefined;
        getter.projection(expr);
        expect(getter.params.ProjectionExpression).toBe(expr);
      });

      itProp('sets the expression string when previously not empty', fc.string(), expr => {
        fc.pre(!_.isEmpty(expr));
        getter.params.ProjectionExpression = 'previous expression';
        getter.projection(expr);
        expect(getter.params.ProjectionExpression).toBe(`previous expression, ${expr}`);
      });

      itProp('sets the expression string when previously empty (array mode)', fc.array(fc.string()), expr => {
        fc.pre(!_.isEmpty(expr));
        getter.params.ProjectionExpression = undefined;
        getter.projection(expr);
        const expectedExpression = expr.map(x => `#${x}`).join(', ');
        expect(getter.params.ProjectionExpression).toBe(expectedExpression);
      });

      itProp('sets the expression string when previously not empty (array mode)', fc.array(fc.string()), expr => {
        fc.pre(!_.isEmpty(expr));
        getter.params.ProjectionExpression = 'previous expression';
        getter.projection(expr);
        const expectedExpression = expr.map(x => `#${x}`).join(', ');
        expect(getter.params.ProjectionExpression).toBe(`previous expression, ${expectedExpression}`);
      });

      itProp('sets the expression attribute names', fc.array(fc.string()), expr => {
        fc.pre(!_.isEmpty(expr));
        getter.params.ExpressionAttributeNames = { previous: 'values' };
        getter.projection(expr);
        const expectedAttributes = expr.reduce((prev, x) => ({ ...prev, [`#${x}`]: x }), {});
        expect(getter.params.ExpressionAttributeNames).toEqual({ previous: 'values', ...expectedAttributes });
      });
    });

    describe('.capacity', () => {
      const allowedStrings = ['INDEXES', 'TOTAL', 'NONE'];
      itProp('throws on disallowed inputs', fc.string(), str => {
        fc.pre(!allowedStrings.includes(str.toUpperCase()));
        expect(() => getter.capacity(str)).toThrow(
          `DbGetter.capacity("${str.toUpperCase()}" <== is not a valid value). Only ${allowedStrings.join(
            ',',
          )} are allowed.`,
        );
      });

      itProp('sets the param on legal input', fc.constantFrom(...allowedStrings), str => {
        getter.capacity(str);
        expect(getter.params.ReturnConsumedCapacity).toBe(str);
      });

      itProp('sets the param allowing for differences in casing', fc.constantFrom(...allowedStrings), str => {
        getter.capacity(str.toLowerCase());
        expect(getter.params.ReturnConsumedCapacity).toBe(str);
      });
    });

    describe('.get', () => {
      itProp('throws when Key and Keys are set', [fc.anything(), fc.anything()], async (key, keys) => {
        fc.pre(!!key);
        fc.pre(!!keys);

        getter.key(key);
        getter.keys(keys);

        await expect(getter.get()).rejects.toThrow('DbGetter <== only key() or keys() may be called, not both');
      });

      it('returns undefined when no keys are set', async () => {
        const result = await getter.get();
        expect(result).toBeUndefined();
      });

      describe('single', () => {
        let expectedResponse;
        beforeEach(() => {
          expectedResponse = { Item: { retrieved: 'item' } };
          getter.client.get = jest.fn().mockReturnValue({ promise: () => Promise.resolve(expectedResponse) });
        });

        it('retrieves the item', async () => {
          getter.key({ some: 'key' });

          const result = await getter.get();

          expect(result).toEqual(expectedResponse.Item);
        });
      });

      describe('batch', () => {
        let expectedResponse;
        const mockTableName = 'mockTable';
        beforeEach(() => {
          getter.table(mockTableName);
          expectedResponse = {
            Responses: {
              [mockTableName]: [{ item: 1 }, { item: 2 }],
            },
          };
          getter.client.batchGet = jest.fn().mockReturnValue({ promise: () => Promise.resolve(expectedResponse) });
        });

        it('retrieves the items', async () => {
          getter.keys({ item1: 'key', item2: 'key' });

          const result = await getter.get();

          expect(result).toEqual(expectedResponse.Responses[mockTableName]);
        });

        it('constructs the batchParams', async () => {
          const keys = { item1: 'key', item2: 'key' };
          getter.keys(keys);

          await getter.get();

          expect(getter.client.batchGet).toHaveBeenCalledWith({
            RequestItems: {
              [mockTableName]: { Keys: keys, TableName: mockTableName },
            },
          });
        });

        itProp(
          'constructs the batchParams with capacity',
          fc.constantFrom('INDEXES', 'TOTAL', 'NONE'),
          async capacity => {
            const keys = { item1: 'key', item2: 'key' };
            getter.keys(keys);
            getter.capacity(capacity);

            await getter.get();

            expect(getter.client.batchGet).toHaveBeenCalledWith({
              RequestItems: {
                ReturnConsumedCapacity: capacity,
                [mockTableName]: { Keys: keys, TableName: mockTableName },
              },
            });
          },
        );
      });
    });
  });
});
