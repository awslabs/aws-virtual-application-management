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

describe('DbService.scanner', () => {
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

  describe('Scanner', () => {
    let scanner;
    beforeEach(() => {
      scanner = sut.helper.scanner();
    });

    describe.each`
      functionName      | parameterValue
      ${'table'}        | ${'mockTableName'}
      ${'index'}        | ${'mockIndexName'}
      ${'props'}        | ${{}}
      ${'start'}        | ${'mockStart'}
      ${'filter'}       | ${'mockFilter'}
      ${'strong'}       | ${{}}
      ${'names'}        | ${{}}
      ${'values'}       | ${{}}
      ${'projection'}   | ${''}
      ${'projection'}   | ${'nonEmpty'}
      ${'select'}       | ${'ALL_ATTRIBUTES'}
      ${'limit'}        | ${100}
      ${'segment'}      | ${100}
      ${'totalSegment'} | ${100}
      ${'capacity'}     | ${'INDEXES'}
    `('$functionName (generic tests)', ({ functionName, parameterValue }) => {
      it('returns "this" for a fluent interface', () => {
        const result = scanner[functionName](parameterValue);
        expect(result).toBe(scanner);
      });
    });

    it('returns a constructed instance', () => {
      expect(scanner.log).toBe(logMockService);
      expect(scanner.client).toBe(sut.client);
      expect(scanner.params).toEqual({});
    });

    describe('.table', () => {
      itProp('throws on non-strings', fc.anything(), tableName => {
        fc.pre(typeof tableName !== 'string');
        expect(() => scanner.table(tableName)).toThrow(
          `DbScanner.table("${tableName}" <== must be a string and can not be empty).`,
        );
      });

      itProp('throws on empty strings', fc.string(), tableName => {
        fc.pre(_.isEmpty(_.trim(tableName)));
        expect(() => scanner.table(tableName)).toThrow(
          `DbScanner.table("${tableName}" <== must be a string and can not be empty).`,
        );
      });

      itProp('sets the table name on valid strings', fc.string(), tableName => {
        fc.pre(!_.isEmpty(_.trim(tableName)));
        scanner.table(tableName);
        expect(scanner.params.TableName).toBe(tableName);
      });
    });

    describe('.index', () => {
      itProp('throws on non-strings', fc.anything(), indexName => {
        fc.pre(typeof indexName !== 'string');
        expect(() => scanner.index(indexName)).toThrow(
          `DbScanner.index("${indexName}" <== must be a string and can not be empty).`,
        );
      });

      itProp('throws on empty strings', fc.string(), indexName => {
        fc.pre(_.isEmpty(_.trim(indexName)));
        expect(() => scanner.index(indexName)).toThrow(
          `DbScanner.index("${indexName}" <== must be a string and can not be empty).`,
        );
      });

      itProp('sets the index name on valid strings', fc.string(), indexName => {
        fc.pre(!_.isEmpty(_.trim(indexName)));
        scanner.index(indexName);
        expect(scanner.params.IndexName).toBe(indexName);
      });
    });

    describe('.props', () => {
      itProp('sets the properties (key, value mode)', [fc.string({ minLength: 1 }), fc.string()], (key, value) => {
        scanner.params = { previous: 'value' };
        scanner.props(key, value);
        expect(scanner.params).toEqual({ previous: 'value', [key]: value });
      });

      itProp('sets the properties (object mode)', fc.object(), parameters => {
        scanner.params = { previous: 'value' };
        scanner.props(parameters);
        expect(scanner.params).toEqual({ previous: 'value', ...parameters });
      });
    });

    describe('.start', () => {
      itProp('sets the key when not empty', fc.string(), key => {
        fc.pre(!!key);
        scanner.start(key);
        expect(scanner.params.ExclusiveStartKey).toBe(key);
      });

      itProp('clears the key when empty', fc.string(), key => {
        fc.pre(!key);
        scanner.start('previouskey');
        scanner.start(key);
        expect(scanner.params.ExclusiveStartKey).toBeUndefined();
      });
    });

    describe('.filter', () => {
      itProp('sets the filter when empty', fc.string(), filter => {
        scanner.params.FilterExpression = undefined;
        scanner.filter(filter);
        expect(scanner.params.FilterExpression).toBe(filter);
      });

      itProp('appends the filter when not empty', fc.string(), filter => {
        scanner.params.FilterExpression = 'existing';
        scanner.filter(filter);
        expect(scanner.params.FilterExpression).toBe(`existing ${filter}`);
      });
    });

    describe('.strong', () => {
      it('sets the ConsistentRead flag', () => {
        scanner.strong();
        expect(scanner.params.ConsistentRead).toBe(true);
      });
    });

    describe.each`
      functionName | parameterName
      ${'names'}   | ${'ExpressionAttributeNames'}
      ${'values'}  | ${'ExpressionAttributeValues'}
    `('.$functionName', ({ functionName, parameterName }) => {
      itProp('throws on non-empty non-objects', fc.anything(), names => {
        fc.pre(!_.isObject(names) && !_.isEmpty(names));
        expect(() => scanner[functionName](names)).toThrow(
          `DbScanner.${functionName}("${names}" <== must be an object).`,
        );
      });

      itProp('reacts gracefully to empties', fc.object(), names => {
        fc.pre(_.isEmpty(names));
        expect(() => scanner[functionName](names)).not.toThrow();
      });

      itProp('populates attributes when previously empty', fc.object(), names => {
        fc.pre(!_.isEmpty(names));
        scanner.params[parameterName] = undefined;
        scanner[functionName](names);
        expect(scanner.params[parameterName]).toEqual(names);
      });

      itProp('populates attributes when previously set', fc.object(), names => {
        fc.pre(!_.isEmpty(names));
        scanner.params[parameterName] = { previous: 'value' };
        scanner[functionName](names);
        expect(scanner.params[parameterName]).toEqual({ previous: 'value', ...names });
      });
    });

    describe('.projection', () => {
      itProp('throws on non-empty non-strings/arrays', fc.anything(), expr => {
        fc.pre(!_.isString(expr) && !_.isArray(expr) && !_.isEmpty(expr));
        expect(() => scanner.projection(expr)).toThrow(
          `DbScanner.projection("${expr}" <== must be a string or an array).`,
        );
      });

      itProp('reacts gracefully to empties', fc.anything(), expr => {
        fc.pre(_.isEmpty(expr));
        expect(() => scanner.projection(expr)).not.toThrow();
      });

      itProp('sets the expression string when previously empty', fc.string(), expr => {
        fc.pre(!_.isEmpty(expr));
        scanner.params.ProjectionExpression = undefined;
        scanner.projection(expr);
        expect(scanner.params.ProjectionExpression).toBe(expr);
      });

      itProp('sets the expression string when previously not empty', fc.string(), expr => {
        fc.pre(!_.isEmpty(expr));
        scanner.params.ProjectionExpression = 'previous expression';
        scanner.projection(expr);
        expect(scanner.params.ProjectionExpression).toBe(`previous expression, ${expr}`);
      });

      itProp('sets the expression string when previously empty (array mode)', fc.array(fc.string()), expr => {
        fc.pre(!_.isEmpty(expr));
        scanner.params.ProjectionExpression = undefined;
        scanner.projection(expr);
        const expectedExpression = expr.map(x => `#${x}`).join(', ');
        expect(scanner.params.ProjectionExpression).toBe(expectedExpression);
      });

      itProp('sets the expression string when previously not empty (array mode)', fc.array(fc.string()), expr => {
        fc.pre(!_.isEmpty(expr));
        scanner.params.ProjectionExpression = 'previous expression';
        scanner.projection(expr);
        const expectedExpression = expr.map(x => `#${x}`).join(', ');
        expect(scanner.params.ProjectionExpression).toBe(`previous expression, ${expectedExpression}`);
      });

      itProp('sets the expression attribute names', fc.array(fc.string()), expr => {
        fc.pre(!_.isEmpty(expr));
        scanner.params.ExpressionAttributeNames = { previous: 'values' };
        scanner.projection(expr);
        const expectedAttributes = expr.reduce((prev, x) => ({ ...prev, [`#${x}`]: x }), {});
        expect(scanner.params.ExpressionAttributeNames).toEqual({ previous: 'values', ...expectedAttributes });
      });
    });

    describe('.select', () => {
      const allowedStrings = ['ALL_ATTRIBUTES', 'ALL_PROJECTED_ATTRIBUTES', 'SPECIFIC_ATTRIBUTES', 'COUNT'];
      itProp('throws on disallowed inputs', fc.string(), str => {
        fc.pre(!allowedStrings.includes(str.toUpperCase()));
        expect(() => scanner.select(str)).toThrow(
          `DbScanner.select("${str.toUpperCase()}" <== is not a valid value). Only ${allowedStrings.join(
            ',',
          )} are allowed.`,
        );
      });

      itProp('sets the param on legal input', fc.constantFrom(...allowedStrings), str => {
        scanner.select(str);
        expect(scanner.params.Select).toBe(str);
      });

      itProp('sets the param allowing for differences in casing', fc.constantFrom(...allowedStrings), str => {
        scanner.select(str.toLowerCase());
        expect(scanner.params.Select).toBe(str);
      });
    });

    describe.each`
      functionName      | parameterName
      ${'limit'}        | ${'Limit'}
      ${'segment'}      | ${'Segment'}
      ${'totalSegment'} | ${'TotalSegment'}
    `('$functionName sets $parameterName', ({ functionName, parameterName }) => {
      itProp('sets the expected parameter', fc.nat(), num => {
        scanner[functionName](num);
        expect(scanner.params[parameterName]).toBe(num);
      });
    });

    describe('.capacity', () => {
      const allowedStrings = ['INDEXES', 'TOTAL', 'NONE'];
      itProp('throws on disallowed inputs', fc.string(), str => {
        fc.pre(!allowedStrings.includes(str.toUpperCase()));
        expect(() => scanner.capacity(str)).toThrow(
          `DbScanner.capacity("${str.toUpperCase()}" <== is not a valid value). Only ${allowedStrings.join(
            ',',
          )} are allowed.`,
        );
      });

      itProp('sets the param on legal input', fc.constantFrom(...allowedStrings), str => {
        scanner.capacity(str);
        expect(scanner.params.ReturnConsumedCapacity).toBe(str);
      });

      itProp('sets the param allowing for differences in casing', fc.constantFrom(...allowedStrings), str => {
        scanner.capacity(str.toLowerCase());
        expect(scanner.params.ReturnConsumedCapacity).toBe(str);
      });
    });

    describe('.scan', () => {
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
        scanner.client.scan = jest
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
        scanner.params = parameters;
        scanner.limit(1); // avoid complication of the test via multiple calls
        await scanner.scan();

        expect(scanner.client.scan).toHaveBeenCalledWith({ ...parameters, ExclusiveStartKey: 'someKey', Limit: 1 });
      });

      it('returns everything on default values', async () => {
        const result = await scanner.scan();

        expect(result).toEqual([{ item: 1 }, { item: 2 }, { item: 3 }]);
      });

      it('returns everything up to the end of the current page when the limit is hit', async () => {
        scanner.limit(1);
        const result = await scanner.scan();

        expect(result).toEqual([{ item: 1 }, { item: 2 }]);
      });

      it('only concats data when the count is > 0', async () => {
        expectedResponse2.Count = 0;

        const result = await scanner.scan();

        expect(result).toEqual([{ item: 1 }, { item: 2 }]);
      });
    });
  });
});
