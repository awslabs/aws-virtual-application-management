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

describe('DbService.deleter', () => {
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

  describe('Deleter', () => {
    let deleter;
    beforeEach(() => {
      deleter = sut.helper.deleter();
    });

    describe.each`
      functionName   | parameterValue
      ${'table'}     | ${'mockTableName'}
      ${'key'}       | ${{}}
      ${'props'}     | ${{}}
      ${'condition'} | ${'mockCondition'}
      ${'names'}     | ${{}}
      ${'values'}    | ${{}}
      ${'return'}    | ${'NONE'}
      ${'capacity'}  | ${'INDEXES'}
      ${'metrics'}   | ${'NONE'}
    `('$functionName (generic tests)', ({ functionName, parameterValue }) => {
      it('returns "this" for a fluent interface', () => {
        const result = deleter[functionName](parameterValue);
        expect(result).toBe(deleter);
      });
    });

    it('returns a constructed instance', () => {
      expect(deleter.log).toBe(logMockService);
      expect(deleter.client).toBe(sut.client);
      expect(deleter.params).toEqual({});
    });

    describe('.table', () => {
      itProp('throws on non-strings', fc.anything(), tableName => {
        fc.pre(typeof tableName !== 'string');
        expect(() => deleter.table(tableName)).toThrow(
          `DbDeleter.table("${tableName}" <== must be a string and can not be empty).`,
        );
      });

      itProp('throws on empty strings', fc.string(), tableName => {
        fc.pre(_.isEmpty(_.trim(tableName)));
        expect(() => deleter.table(tableName)).toThrow(
          `DbDeleter.table("${tableName}" <== must be a string and can not be empty).`,
        );
      });

      itProp('sets the table name on valid strings', fc.string(), tableName => {
        fc.pre(!_.isEmpty(_.trim(tableName)));
        deleter.table(tableName);
        expect(deleter.params.TableName).toBe(tableName);
      });
    });

    describe('.key', () => {
      itProp('sets the key (key value mode)', [fc.string(), fc.anything()], (key, value) => {
        deleter.key(key, value);

        expect(deleter.params.Key[key]).toBe(value);
      });

      itProp('sets the key (object mode)', fc.object(), key => {
        deleter.params.Key = { previous: 'value' };

        deleter.key(key);

        expect(deleter.params.Key).toEqual({ previous: 'value', ...key });
      });
    });

    describe('.props', () => {
      itProp('sets the properties (key value mode)', [fc.string({ minLength: 1 }), fc.string()], (key, value) => {
        deleter.params = { previous: 'value' };
        deleter.props(key, value);
        expect(deleter.params).toEqual({ previous: 'value', [key]: value });
      });

      itProp('sets the properties (object mode)', fc.object(), parameters => {
        deleter.params = { previous: 'value' };
        deleter.props(parameters);
        expect(deleter.params).toEqual({ previous: 'value', ...parameters });
      });
    });

    describe('.condition', () => {
      itProp('sets the condition', fc.string(), condition => {
        deleter.params.ConditionExpression = undefined;
        deleter.condition(condition);
        expect(deleter.params.ConditionExpression).toBe(condition);
      });

      itProp('cannot be called twice', fc.string(), condition => {
        fc.pre(!!condition);
        deleter.params.ConditionExpression = undefined;
        deleter.condition(condition);

        expect(() => deleter.condition(condition)).toThrow(
          `DbDeleter.condition("${condition}"), you already called condition() before this call.`,
        );
      });
    });

    describe.each`
      functionName | parameterName
      ${'names'}   | ${'ExpressionAttributeNames'}
      ${'values'}  | ${'ExpressionAttributeValues'}
    `('.$functionName', ({ functionName, parameterName }) => {
      itProp('throws on non-empty non-objects', fc.anything(), names => {
        fc.pre(!_.isObject(names) && !_.isEmpty(names));
        expect(() => deleter[functionName](names)).toThrow(
          `DbDeleter.${functionName}("${names}" <== must be an object).`,
        );
      });

      itProp('reacts gracefully to empties', fc.object(), names => {
        fc.pre(_.isEmpty(names));
        expect(() => deleter[functionName](names)).not.toThrow();
      });

      itProp('populates attributes when previously empty', fc.object(), names => {
        fc.pre(!_.isEmpty(names));
        deleter.params[parameterName] = undefined;
        deleter[functionName](names);
        expect(deleter.params[parameterName]).toEqual(names);
      });

      itProp('populates attributes when previously set', fc.object(), names => {
        fc.pre(!_.isEmpty(names));
        deleter.params[parameterName] = { previous: 'value' };
        deleter[functionName](names);
        expect(deleter.params[parameterName]).toEqual({ previous: 'value', ...names });
      });
    });

    describe.each`
      functionName  | allowedValues                   | parameterName
      ${'return'}   | ${['NONE', 'ALL_OLD']}          | ${'ReturnValues'}
      ${'capacity'} | ${['INDEXES', 'TOTAL', 'NONE']} | ${'ReturnConsumedCapacity'}
      ${'metrics'}  | ${['NONE', 'SIZE']}             | ${'ReturnItemCollectionMetrics'}
    `('$functionName', ({ functionName, allowedValues, parameterName }) => {
      itProp('throws on disallowed inputs', fc.string(), str => {
        fc.pre(!allowedValues.includes(str.toUpperCase()));
        expect(() => deleter[functionName](str)).toThrow(
          `DbDeleter.${functionName}("${str.toUpperCase()}" <== is not a valid value). Only ${allowedValues.join(
            ',',
          )} are allowed.`,
        );
      });

      itProp('sets the param on legal input', fc.constantFrom(...allowedValues), str => {
        deleter[functionName](str);
        expect(deleter.params[parameterName]).toBe(str);
      });

      itProp('sets the param allowing for differences in casing', fc.constantFrom(...allowedValues), str => {
        deleter[functionName](str.toLowerCase());
        expect(deleter.params[parameterName]).toBe(str);
      });
    });

    describe('.delete', () => {
      let expectedResponse;
      beforeEach(() => {
        expectedResponse = { Item: { deleted: 'item' } };
        deleter.client.delete = jest.fn().mockReturnValue({ promise: () => Promise.resolve(expectedResponse) });
      });

      it('returns the deleted item', async () => {
        const result = await deleter.delete();

        expect(result).toEqual(expectedResponse.Item);
      });

      itProp('passes params to the client', fc.anything(), async parameters => {
        deleter.params = parameters;

        await deleter.delete();

        expect(deleter.client.delete).toHaveBeenCalledWith(parameters);
      });
    });

    describe('.asTransactionItem', () => {
      itProp('returns the params in the expected form', fc.anything(), parameters => {
        deleter.params = parameters;

        expect(deleter.asTransactionItem()).toEqual({ Delete: parameters });
      });
    });
  });
});
