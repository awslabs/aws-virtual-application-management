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

import { encode } from '../../utils/base64-url';
import DbService from '../../db-service';

class MockDynamoDB {}

class DocumentClient {}

describe('DbService.query', () => {
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

  describe('Query', () => {
    let query;
    beforeEach(() => {
      query = sut.helper.query();
    });

    describe.each`
      functionName    | parameterValue
      ${'table'}      | ${['mockTableName']}
      ${'index'}      | ${['mockIndexName']}
      ${'props'}      | ${[{}]}
      ${'key'}        | ${['name', 'value']}
      ${'sortKey'}    | ${['name']}
      ${'start'}      | ${['value']}
      ${'filter'}     | ${['value']}
      ${'strong'}     | ${[]}
      ${'names'}      | ${[{}]}
      ${'values'}     | ${[{}]}
      ${'projection'} | ${['']}
      ${'select'}     | ${['ALL_ATTRIBUTES']}
      ${'limit'}      | ${[42]}
      ${'forward'}    | ${[true]}
      ${'capacity'}   | ${['INDEXES']}
    `('$functionName (generic tests)', ({ functionName, parameterValue }) => {
      it('returns "this" for a fluent interface', () => {
        const result = query[functionName](...parameterValue);
        expect(result).toBe(query);
      });
    });

    describe.each`
      functionName | parameterValue
      ${'eq'}      | ${['value']}
      ${'lt'}      | ${['value']}
      ${'lte'}     | ${['value']}
      ${'gt'}      | ${['value']}
      ${'gte'}     | ${['value']}
      ${'between'} | ${['value1', 'value2']}
      ${'begins'}  | ${['value']}
    `('$functionName (generic tests)', ({ functionName, parameterValue }) => {
      it('throws on missing sort key', () => {
        expect(() => query[functionName](...parameterValue)).toThrow(
          `You tried to call DbQuery.${functionName}(), however, you must call DbQuery.sortKey() first.`,
        );
      });

      it('returns "this" for a fluent interface when the sort key is given', () => {
        query.sortKey('mockSortKey');
        const result = query[functionName](...parameterValue);
        expect(result).toBe(query);
      });
    });

    it('returns a constructed instance', () => {
      expect(query.log).toBe(logMockService);
      expect(query.client).toBe(sut.client);
      expect(query.params).toEqual({});
    });

    describe('.table', () => {
      itProp('throws on non-strings', fc.anything(), tableName => {
        fc.pre(typeof tableName !== 'string');
        expect(() => query.table(tableName)).toThrow(
          `DbQuery.table("${tableName}" <== must be a string and can not be empty).`,
        );
      });

      itProp('throws on empty strings', fc.string(), tableName => {
        fc.pre(_.isEmpty(_.trim(tableName)));
        expect(() => query.table(tableName)).toThrow(
          `DbQuery.table("${tableName}" <== must be a string and can not be empty).`,
        );
      });

      itProp('sets the table name on valid strings', fc.string(), tableName => {
        fc.pre(!_.isEmpty(_.trim(tableName)));
        query.table(tableName);
        expect(query.params.TableName).toBe(tableName);
      });
    });

    describe('.index', () => {
      itProp('throws on non-strings', fc.anything(), indexName => {
        fc.pre(typeof indexName !== 'string');
        expect(() => query.index(indexName)).toThrow(
          `DbQuery.index("${indexName}" <== must be a string and can not be empty).`,
        );
      });

      itProp('throws on empty strings', fc.string(), indexName => {
        fc.pre(_.isEmpty(_.trim(indexName)));
        expect(() => query.index(indexName)).toThrow(
          `DbQuery.index("${indexName}" <== must be a string and can not be empty).`,
        );
      });

      itProp('sets the index name on valid strings', fc.string(), indexName => {
        fc.pre(!_.isEmpty(_.trim(indexName)));
        query.index(indexName);
        expect(query.params.IndexName).toBe(indexName);
      });
    });

    describe('.props', () => {
      itProp('sets the properties (key value mode)', [fc.string({ minLength: 1 }), fc.string()], (key, value) => {
        query.params = { previous: 'value' };
        query.props(key, value);
        expect(query.params).toEqual({ previous: 'value', [key]: value });
      });

      itProp('sets the properties (object mode)', fc.object(), parameters => {
        query.params = { previous: 'value' };
        query.props(parameters);
        expect(query.params).toEqual({ previous: 'value', ...parameters });
      });
    });

    describe('.key', () => {
      itProp('throws on non-strings as keys', fc.anything(), name => {
        fc.pre(typeof name !== 'string');
        expect(() => query.key(name, 'value')).toThrow(
          `DbQuery.key("${name}" <== must be a string and can not be empty).`,
        );
      });

      itProp('throws on empty names', fc.anything(), name => {
        fc.pre(_.isEmpty(_.trim(name)));
        expect(() => query.key(name, 'value')).toThrow(
          `DbQuery.key("${name}" <== must be a string and can not be empty).`,
        );
      });

      itProp('sets the key', [fc.string(), fc.string()], (name, value) => {
        fc.pre(_.isString(name) && !_.isEmpty(_.trim(name)));

        query.params.KeyConditionExpression = undefined;
        query.params.ExpressionAttributeNames = undefined;
        query.params.ExpressionAttributeValues = undefined;

        query.key(name, value);

        expect(query.params.KeyConditionExpression).toEqual(`#${name} = :${name}`);
        expect(query.params.ExpressionAttributeNames).toEqual({ [`#${name}`]: name });
        expect(query.params.ExpressionAttributeValues).toEqual({ [`:${name}`]: value });
      });
    });

    describe('.sortKey', () => {
      itProp('sets the sort key', fc.string(), name => {
        query.params.ExpressionAttributeNames = undefined;

        query.sortKey(name);

        expect(query.sortKeyName).toEqual(name);
        expect(query.params.ExpressionAttributeNames).toEqual({ [`#${name}`]: name });
      });
    });

    describe.each`
      functionName | expression
      ${'eq'}      | ${['=']}
      ${'lt'}      | ${['<']}
      ${'lte'}     | ${['<=']}
      ${'gt'}      | ${['>']}
      ${'gte'}     | ${['>=']}
    `('$functionName', ({ functionName, expression }) => {
      itProp('generates the expected expression', [fc.string(), fc.string()], (sortKey, value) => {
        fc.pre(!!sortKey);

        query.params.KeyConditionExpression = undefined;
        query.params.ExpressionAttributeValues = undefined;
        query.sortKey(sortKey);

        query[functionName](value);

        expect(query.params.KeyConditionExpression).toEqual(`#${sortKey} ${expression} :${sortKey}`);
        expect(query.params.ExpressionAttributeValues).toEqual({ [`:${sortKey}`]: value });
      });
    });

    describe('.between', () => {
      itProp(
        'generates the expected expression',
        [fc.string(), fc.string(), fc.string()],
        (sortKey, value1, value2) => {
          fc.pre(!!sortKey);

          query.params.KeyConditionExpression = undefined;
          query.params.ExpressionAttributeValues = undefined;
          query.sortKey(sortKey);

          query.between(value1, value2);

          expect(query.params.KeyConditionExpression).toEqual(`#${sortKey} BETWEEN :${sortKey}1 AND :${sortKey}2`);
          expect(query.params.ExpressionAttributeValues).toEqual({
            [`:${sortKey}1`]: value1,
            [`:${sortKey}2`]: value2,
          });
        },
      );
    });

    describe('.begins', () => {
      itProp('generates the expected expression', [fc.string(), fc.string()], (sortKey, value) => {
        fc.pre(!!sortKey);

        query.params.KeyConditionExpression = undefined;
        query.params.ExpressionAttributeValues = undefined;
        query.sortKey(sortKey);

        query.begins(value);

        expect(query.params.KeyConditionExpression).toEqual(`begins_with ( #${sortKey}, :${sortKey} )`);
        expect(query.params.ExpressionAttributeValues).toEqual({ [`:${sortKey}`]: value });
      });
    });

    describe('.start', () => {
      itProp('deletes when the key is empty', fc.string(), key => {
        fc.pre(!key);
        query.start(key);
        expect(query.params.ExclusiveStartKey).toBeUndefined();
      });

      itProp('sets when the key is not empty', fc.string(), key => {
        fc.pre(key);
        query.start(key);
        expect(query.params.ExclusiveStartKey).toBe(key);
      });
    });

    describe('.filter', () => {
      itProp('sets the filter when empty', fc.string(), filter => {
        query.params.FilterExpression = undefined;
        query.filter(filter);
        expect(query.params.FilterExpression).toBe(filter);
      });

      itProp('appends the filter when not empty', fc.string(), filter => {
        query.params.FilterExpression = 'existing';
        query.filter(filter);
        expect(query.params.FilterExpression).toBe(`existing ${filter}`);
      });
    });

    describe('.strong', () => {
      it('sets the ConsistentRead flag', () => {
        query.strong();
        expect(query.params.ConsistentRead).toBe(true);
      });
    });

    describe.each`
      functionName | parameterName
      ${'names'}   | ${'ExpressionAttributeNames'}
      ${'values'}  | ${'ExpressionAttributeValues'}
    `('.$functionName', ({ functionName, parameterName }) => {
      itProp('throws on non-empty non-objects', fc.anything(), names => {
        fc.pre(!_.isObject(names) && !_.isEmpty(names));
        expect(() => query[functionName](names)).toThrow(`DbQuery.${functionName}("${names}" <== must be an object).`);
      });

      itProp('reacts gracefully to empties', fc.object(), names => {
        fc.pre(_.isEmpty(names));
        expect(() => query[functionName](names)).not.toThrow();
      });

      itProp('populates attributes when previously empty', fc.object(), names => {
        fc.pre(!_.isEmpty(names));
        query.params[parameterName] = undefined;
        query[functionName](names);
        expect(query.params[parameterName]).toEqual(names);
      });

      itProp('populates attributes when previously set', fc.object(), names => {
        fc.pre(!_.isEmpty(names));
        query.params[parameterName] = { previous: 'value' };
        query[functionName](names);
        expect(query.params[parameterName]).toEqual({ previous: 'value', ...names });
      });
    });

    describe('.projection', () => {
      itProp('throws on non-empty non-strings/arrays', fc.anything(), expr => {
        fc.pre(!_.isString(expr) && !_.isArray(expr) && !_.isEmpty(expr));
        expect(() => query.projection(expr)).toThrow(`DbQuery.projection("${expr}" <== must be a string or an array).`);
      });

      itProp('reacts gracefully to empties', fc.anything(), expr => {
        fc.pre(_.isEmpty(expr));
        expect(() => query.projection(expr)).not.toThrow();
      });

      itProp('sets the expression string when previously empty', fc.string(), expr => {
        fc.pre(!_.isEmpty(expr));
        query.params.ProjectionExpression = undefined;
        query.projection(expr);
        expect(query.params.ProjectionExpression).toBe(expr);
      });

      itProp('sets the expression string when previously not empty', fc.string(), expr => {
        fc.pre(!_.isEmpty(expr));
        query.params.ProjectionExpression = 'previous expression';
        query.projection(expr);
        expect(query.params.ProjectionExpression).toBe(`previous expression, ${expr}`);
      });

      itProp('sets the expression string when previously empty (array mode)', fc.array(fc.string()), expr => {
        fc.pre(!_.isEmpty(expr));
        query.params.ProjectionExpression = undefined;
        query.projection(expr);
        const expectedExpression = expr.map(x => `#${x}`).join(', ');
        expect(query.params.ProjectionExpression).toBe(expectedExpression);
      });

      itProp('sets the expression string when previously not empty (array mode)', fc.array(fc.string()), expr => {
        fc.pre(!_.isEmpty(expr));
        query.params.ProjectionExpression = 'previous expression';
        query.projection(expr);
        const expectedExpression = expr.map(x => `#${x}`).join(', ');
        expect(query.params.ProjectionExpression).toBe(`previous expression, ${expectedExpression}`);
      });

      itProp('sets the expression attribute names', fc.array(fc.string()), expr => {
        fc.pre(!_.isEmpty(expr));
        query.params.ExpressionAttributeNames = { previous: 'values' };
        query.projection(expr);
        const expectedAttributes = expr.reduce((prev, x) => ({ ...prev, [`#${x}`]: x }), {});
        expect(query.params.ExpressionAttributeNames).toEqual({ previous: 'values', ...expectedAttributes });
      });
    });

    describe('.select', () => {
      const allowedStrings = ['ALL_ATTRIBUTES', 'ALL_PROJECTED_ATTRIBUTES', 'SPECIFIC_ATTRIBUTES', 'COUNT'];
      itProp('throws on disallowed inputs', fc.string(), str => {
        fc.pre(!allowedStrings.includes(str.toUpperCase()));
        expect(() => query.select(str)).toThrow(
          `DbQuery.select("${str.toUpperCase()}" <== is not a valid value). Only ${allowedStrings.join(
            ',',
          )} are allowed.`,
        );
      });

      itProp('sets the param on legal input', fc.constantFrom(...allowedStrings), str => {
        query.select(str);
        expect(query.params.Select).toBe(str);
      });

      itProp('sets the param allowing for differences in casing', fc.constantFrom(...allowedStrings), str => {
        query.select(str.toLowerCase());
        expect(query.params.Select).toBe(str);
      });
    });

    describe('limit', () => {
      itProp('sets the expected parameter', fc.nat(), num => {
        query.limit(num);
        expect(query.params.Limit).toBe(num);
      });
    });

    describe('forward', () => {
      it('sets to true when no param is given', () => {
        query.forward();
        expect(query.params.ScanIndexForward).toBe(true);
      });

      itProp('sets the expected parameter', fc.boolean(), forward => {
        query.forward(forward);
        expect(query.params.ScanIndexForward).toBe(forward);
      });
    });

    describe('.capacity', () => {
      const allowedStrings = ['INDEXES', 'TOTAL', 'NONE'];
      itProp('throws on disallowed inputs', fc.string(), str => {
        fc.pre(!allowedStrings.includes(str.toUpperCase()));
        expect(() => query.capacity(str)).toThrow(
          `DbQuery.capacity("${str.toUpperCase()}" <== is not a valid value). Only ${allowedStrings.join(
            ',',
          )} are allowed.`,
        );
      });

      itProp('sets the param on legal input', fc.constantFrom(...allowedStrings), str => {
        query.capacity(str);
        expect(query.params.ReturnConsumedCapacity).toBe(str);
      });

      itProp('sets the param allowing for differences in casing', fc.constantFrom(...allowedStrings), str => {
        query.capacity(str.toLowerCase());
        expect(query.params.ReturnConsumedCapacity).toBe(str);
      });
    });

    describe('.query', () => {
      let expectedResponse1;
      let expectedResponse2;
      const setup = () => {
        expectedResponse1 = {
          LastEvaluatedKey: 'someKey',
          Count: 2,
          Items: [{ item: 1 }, { item: 2 }],
        };
        expectedResponse2 = {
          Count: 1,
          Items: [{ item: 3 }],
        };
        query.client.query = jest
          .fn()
          .mockReturnValueOnce({ promise: () => Promise.resolve(expectedResponse1) })
          .mockReturnValue({ promise: () => Promise.resolve(expectedResponse2) });
      };

      beforeEach(() => {
        setup();
      });

      itProp('passes params to the client', fc.object(), async parameters => {
        // itProp doesn't call beforeEach
        setup();
        query.params = parameters;
        query.limit(1); // avoid complication of the test via multiple calls
        await query.query();

        expect(query.client.query).toHaveBeenCalledWith({ ...parameters, ExclusiveStartKey: 'someKey', Limit: 1 });
      });

      it('returns everything on default values', async () => {
        const result = await query.query();

        expect(result).toEqual([{ item: 1 }, { item: 2 }, { item: 3 }]);
      });

      it('returns everything up to the end of the current page when the limit is hit', async () => {
        query.limit(1);
        const result = await query.query();

        expect(result).toEqual([{ item: 1 }, { item: 2 }]);
      });

      it('only concats data when the count is > 0', async () => {
        expectedResponse2.Count = 0;

        const result = await query.query();

        expect(result).toEqual([{ item: 1 }, { item: 2 }]);
      });
    });

    describe('.queryPage', () => {
      let expectedResponse1;
      let expectedResponse2;
      const setup = () => {
        expectedResponse1 = {
          LastEvaluatedKey: 'someKey',
          Count: 2,
          Items: [{ item: 1 }, { item: 2 }],
        };
        expectedResponse2 = {
          Count: 1,
          Items: [{ item: 3 }],
        };
        query.client.query = jest
          .fn()
          .mockReturnValueOnce({ promise: () => Promise.resolve(expectedResponse1) })
          .mockReturnValue({ promise: () => Promise.resolve(expectedResponse2) });
      };

      beforeEach(() => {
        setup();
      });

      it('throws when the limit is not set', async () => {
        await expect(query.queryPage()).rejects.toThrow(
          'DbQuery.queryPage() Limit was not set. Must specify a limit before performing a page scan',
        );
      });

      itProp('passes params to the client (1st page)', fc.object(), async parameters => {
        // itProp doesn't call beforeEach
        setup();
        query.params = parameters;
        query.limit(1);
        await query.queryPage();

        expect(query.client.query).toHaveBeenCalledWith({ ...parameters, Limit: 1 });
      });

      itProp('passes params to the client (2nd page)', fc.object(), async parameters => {
        // itProp doesn't call beforeEach
        setup();
        query.client.query.mockClear();
        query.params = parameters;
        query.limit(1);
        await query.queryPage(encode(JSON.stringify('testToken')));
        expect(query.client.query).toHaveBeenCalledWith({ ...parameters, ExclusiveStartKey: 'testToken', Limit: 1 });
      });

      it('returns the first page', async () => {
        query.limit(100);

        const result = await query.queryPage();

        expect(result).toEqual({
          items: [{ item: 1 }, { item: 2 }],
          nextToken: encode(JSON.stringify('someKey')),
        });
      });

      it('returns the second page', async () => {
        query.limit(100);

        await query.queryPage();
        const result = await query.queryPage(encode(JSON.stringify('testToken')));

        expect(result).toEqual({
          items: [{ item: 3 }],
          nextToken: undefined,
        });
      });
    });
  });
});
