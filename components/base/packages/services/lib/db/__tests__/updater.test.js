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

  describe('Updater', () => {
    let updater;
    beforeEach(() => {
      updater = sut.helper.updater();
    });

    describe.each`
      functionName          | parameterValue
      ${'table'}            | ${'mockTableName'}
      ${'mark'}             | ${[]}
      ${'key'}              | ${''}
      ${'props'}            | ${''}
      ${'disableCreatedAt'} | ${undefined}
      ${'createdAt'}        | ${'2020-01-01'}
      ${'disableUpdatedAt'} | ${undefined}
      ${'updatedAt'}        | ${'2020-01-01'}
      ${'rev'}              | ${''}
      ${'item'}             | ${{ dummy: 'item' }}
      ${'set'}              | ${'expression'}
      ${'add'}              | ${'expression'}
      ${'remove'}           | ${'expression'}
      ${'delete'}           | ${'expression'}
      ${'names'}            | ${{}}
      ${'values'}           | ${{}}
      ${'condition'}        | ${'expression'}
      ${'return'}           | ${'NONE'}
      ${'metrics'}          | ${'NONE'}
      ${'capacity'}         | ${'NONE'}
    `('$functionName (generic tests)', ({ functionName, parameterValue }) => {
      it('returns "this" for a fluent interface', () => {
        const result = updater[functionName](parameterValue);
        expect(result).toBe(updater);
      });
    });

    describe.each`
      functionName          | parameterValue
      ${'mark'}             | ${[]}
      ${'key'}              | ${''}
      ${'disableCreatedAt'} | ${undefined}
      ${'createdAt'}        | ${'2020-01-01'}
      ${'disableUpdatedAt'} | ${undefined}
      ${'updatedAt'}        | ${'2020-01-01'}
    `('$functionName (generic tests)', ({ functionName, parameterValue }) => {
      it('throws after update has been called', () => {
        updater.params.UpdateExpression = 'mockExpression';
        expect(() => updater[functionName](parameterValue)).toThrow(
          `You tried to call DbUpdater.${functionName}() after you called DbUpdater.update(). Call ${functionName}() before calling update().`,
        );
      });
    });

    describe('.table', () => {
      itProp('throws on non-strings', fc.anything(), tableName => {
        fc.pre(typeof tableName !== 'string');
        expect(() => updater.table(tableName)).toThrow(
          `DbUpdater.table("${tableName}" <== must be a string and can not be empty).`,
        );
      });

      itProp('throws on empty strings', fc.string(), tableName => {
        fc.pre(_.isEmpty(_.trim(tableName)));
        expect(() => updater.table(tableName)).toThrow(
          `DbUpdater.table("${tableName}" <== must be a string and can not be empty).`,
        );
      });

      itProp('sets the table name on valid strings', fc.string(), tableName => {
        fc.pre(!_.isEmpty(_.trim(tableName)));
        updater.table(tableName);
        expect(updater.params.TableName).toBe(tableName);
      });
    });

    describe('.mark', () => {
      itProp('fills the marked array', fc.array(fc.string()), arr => {
        updater.mark(arr);
        arr.forEach(item => {
          expect(updater.marked[item]).toBe(true);
        });
      });
    });

    describe('.key', () => {
      itProp('sets the key (key value mode)', [fc.string(), fc.anything()], (key, value) => {
        updater.key(key, value);

        expect(updater.params.Key[key]).toBe(value);
      });

      itProp('sets the key (object mode)', fc.object(), key => {
        updater.params.Key = { previous: 'value' };

        updater.key(key);

        expect(updater.params.Key).toEqual({ previous: 'value', ...key });
      });
    });

    describe('.props', () => {
      itProp('sets the properties (key value mode)', [fc.string({ minLength: 1 }), fc.string()], (key, value) => {
        updater.params = { previous: 'value' };
        updater.props(key, value);
        expect(updater.params).toEqual({ previous: 'value', [key]: value });
      });

      itProp('sets the properties (object mode)', fc.object(), parameters => {
        updater.params = { previous: 'value' };
        updater.props(parameters);
        expect(updater.params).toEqual({ previous: 'value', ...parameters });
      });
    });

    describe.each`
      functionName   | field
      ${'createdAt'} | ${'createdAtState'}
      ${'updatedAt'} | ${'updatedAtState'}
    `('$functionName (generic tests)', ({ functionName, field }) => {
      itProp('throws on invalid input', fc.string(), date => {
        fc.pre(!_.isDate(date) && (!_.isString(date) || _.isEmpty(_.trim(date))));
        expect(() => updater[functionName](date)).toThrow(
          `DbUpdater.${functionName}("${date}" <== must be a string or Date and can not be empty).`,
        );
      });

      itProp('enables the expected field and leaves the string untouched', fc.string(), date => {
        fc.pre(!_.isEmpty(_.trim(date)));
        updater[functionName](date);
        expect(updater[field].enabled).toBe(true);
        expect(updater[field].value).toBe(date);
      });

      itProp('enables the expected field and converts a date to ISO', fc.date(), date => {
        updater[functionName](date);
        expect(updater[field].enabled).toBe(true);
        expect(updater[field].value).toBe(date.toISOString());
      });
    });

    describe.each`
      functionName          | field
      ${'disableCreatedAt'} | ${'createdAtState'}
      ${'disableUpdatedAt'} | ${'updatedAtState'}
    `('$functionName (generic tests)', ({ functionName, field }) => {
      it('disables the expected field', () => {
        updater[functionName]();
        expect(updater[field].enabled).toBe(false);
      });
    });

    describe('.rev', () => {
      itProp('reacts gracefully to empties', fc.anything(), rev => {
        fc.pre(_.isNil(rev));
        expect(() => updater.rev(rev)).not.toThrow();
      });

      it('sets the rev and changes the internal state', () => {
        updater.rev('testRev');

        expect(updater.params.ConditionExpression).toBe('#rev = :rev');
        expect(updater.params.ExpressionAttributeNames).toEqual({ '#rev': 'rev' });
        expect(updater.params.ExpressionAttributeValues).toEqual({ ':rev': 'testRev', ':_addOne': 1 });
        expect(updater.internals.set).toEqual(['#rev = #rev + :_addOne']);
      });
    });

    describe('.item', () => {
      let dateSpy;
      beforeEach(() => {
        const mockDate = new Date(1607731200000); // '2020-12-12T00:00:00.000Z'
        dateSpy = jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
      });

      afterEach(() => {
        dateSpy.mockRestore();
      });

      it('handles empties gracefully (undefined)', () => {
        expect(() => updater.item()).not.toThrow();
      });

      it('handles empties gracefully (empty obj)', () => {
        expect(() => updater.item({})).not.toThrow();
      });

      it('creates the expected state', () => {
        updater.key('testKeyField', 'keyValue');
        updater.item({
          testKeyField: 'ignoredKeyValue',
          otherField: 'updatevalue',
          rev: 'revPassedThrough',
          removeUndefined: undefined,
          createdAt: 'willBeOverridden',
          updatedAt: 'willBeOverridden',
        });

        expect(updater.params.ExpressionAttributeNames).toEqual({
          '#otherField': 'otherField',
          '#rev': 'rev',
          '#createdAt': 'createdAt',
          '#updatedAt': 'updatedAt',
        });
        expect(updater.params.ExpressionAttributeValues).toEqual({
          ':otherField': 'updatevalue',
          ':rev': 'revPassedThrough',
          ':createdAt': '2020-12-12T00:00:00.000Z',
          ':updatedAt': '2020-12-12T00:00:00.000Z',
        });
      });

      it('creates the expected state (marked field empty)', () => {
        updater.key('testKeyField', 'keyValue');
        updater.mark(['markedField']);
        updater.item({
          testKeyField: 'ignoredKeyValue',
          otherField: 'updatevalue',
          rev: 'revPassedThrough',
          removeUndefined: undefined,
          createdAt: 'willBeOverridden',
          updatedAt: 'willBeOverridden',
          markedField: '',
        });

        expect(updater.params.ExpressionAttributeNames).toEqual({
          '#otherField': 'otherField',
          '#rev': 'rev',
          '#createdAt': 'createdAt',
          '#updatedAt': 'updatedAt',
          '#markedField': 'markedField',
        });
        expect(updater.params.ExpressionAttributeValues).toEqual({
          ':otherField': 'updatevalue',
          ':rev': 'revPassedThrough',
          ':createdAt': '2020-12-12T00:00:00.000Z',
          ':updatedAt': '2020-12-12T00:00:00.000Z',
          ':markedField': null,
        });
      });

      it('creates the expected state (marked field creates a set)', () => {
        updater.key('testKeyField', 'keyValue');
        updater.mark(['markedField']);
        updater.client.createSet = jest.fn(rawValue => `createSet(${rawValue})`);

        updater.item({
          testKeyField: 'ignoredKeyValue',
          otherField: 'updatevalue',
          rev: 'revPassedThrough',
          removeUndefined: undefined,
          createdAt: 'willBeOverridden',
          updatedAt: 'willBeOverridden',
          markedField: 'rawMarkedValue',
        });

        expect(updater.params.ExpressionAttributeNames).toEqual({
          '#otherField': 'otherField',
          '#rev': 'rev',
          '#createdAt': 'createdAt',
          '#updatedAt': 'updatedAt',
          '#markedField': 'markedField',
        });
        expect(updater.params.ExpressionAttributeValues).toEqual({
          ':otherField': 'updatevalue',
          ':rev': 'revPassedThrough',
          ':createdAt': '2020-12-12T00:00:00.000Z',
          ':updatedAt': '2020-12-12T00:00:00.000Z',
          ':markedField': 'createSet(rawMarkedValue)',
        });
      });

      it('creates the expected state (timestamping disabled)', () => {
        updater.key('testKeyField', 'keyValue');
        updater.disableCreatedAt();
        updater.disableUpdatedAt();
        updater.item({
          testKeyField: 'ignoredKeyValue',
          otherField: 'updatevalue',
          rev: 'revPassedThrough',
          removeUndefined: undefined,
          createdAt: 'willBeKept(Create)',
          updatedAt: 'willBeKept(Update)',
        });

        expect(updater.params.ExpressionAttributeNames).toEqual({
          '#otherField': 'otherField',
          '#rev': 'rev',
          '#createdAt': 'createdAt',
          '#updatedAt': 'updatedAt',
        });

        expect(updater.params.ExpressionAttributeValues).toEqual({
          ':otherField': 'updatevalue',
          ':rev': 'revPassedThrough',
          ':createdAt': 'willBeKept(Create)',
          ':updatedAt': 'willBeKept(Update)',
        });
      });

      it('creates the expected state (rev given)', () => {
        updater.key('testKeyField', 'keyValue');
        updater.rev('givenRevValue');
        updater.item({
          testKeyField: 'ignoredKeyValue',
          otherField: 'updatevalue',
          rev: 'willBeOverridden',
          removeUndefined: undefined,
          createdAt: 'willBeOverridden',
          updatedAt: 'willBeOverridden',
        });

        expect(updater.params.ExpressionAttributeNames).toEqual({
          '#otherField': 'otherField',
          '#rev': 'rev',
          '#createdAt': 'createdAt',
          '#updatedAt': 'updatedAt',
        });
        expect(updater.params.ExpressionAttributeValues).toEqual({
          ':_addOne': 1,
          ':otherField': 'updatevalue',
          ':rev': 'givenRevValue',
          ':createdAt': '2020-12-12T00:00:00.000Z',
          ':updatedAt': '2020-12-12T00:00:00.000Z',
        });
      });
    });

    describe.each`
      functionName | internalArray
      ${'set'}     | ${'set'}
      ${'add'}     | ${'add'}
      ${'remove'}  | ${'remove'}
      ${'delete'}  | ${'delete'}
    `('$functionName', ({ functionName, internalArray }) => {
      itProp('handles empties gracefully', fc.anything(), expression => {
        fc.pre(_.isEmpty(expression));
        expect(() => updater[functionName](expression)).not.toThrow();
      });

      it('pushes the expression to the expected array', () => {
        updater[functionName]('testExpression');
        expect(updater.internals[internalArray]).toEqual(['testExpression']);
      });
    });

    describe('.remove', () => {
      it('can handle array input', () => {
        updater.remove(['remove1', 'remove2']);
        expect(updater.internals.remove).toEqual(['remove1', 'remove2']);
      });
    });

    describe.each`
      functionName | parameterName
      ${'names'}   | ${'ExpressionAttributeNames'}
      ${'values'}  | ${'ExpressionAttributeValues'}
    `('.$functionName', ({ functionName, parameterName }) => {
      itProp('throws on non-empty non-objects', fc.anything(), names => {
        fc.pre(!_.isObject(names) && !_.isEmpty(names));
        expect(() => updater[functionName](names)).toThrow(
          `DbUpdater.${functionName}("${names}" <== must be an object).`,
        );
      });

      itProp('reacts gracefully to empties', fc.object(), names => {
        fc.pre(_.isEmpty(names));
        expect(() => updater[functionName](names)).not.toThrow();
      });

      itProp('populates attributes when previously empty', fc.object(), names => {
        fc.pre(!_.isEmpty(names));
        updater.params[parameterName] = undefined;
        updater[functionName](names);
        expect(updater.params[parameterName]).toEqual(names);
      });

      itProp('populates attributes when previously set', fc.object(), names => {
        fc.pre(!_.isEmpty(names));
        updater.params[parameterName] = { previous: 'value' };
        updater[functionName](names);
        expect(updater.params[parameterName]).toEqual({ previous: 'value', ...names });
      });
    });

    describe('.condition', () => {
      itProp('throws on empty', fc.anything(), condition => {
        fc.pre(!_.isString(condition) || _.isEmpty(_.trim(condition)));
        expect(() => updater.condition(condition)).toThrow(
          `DbUpdater.condition("${condition}" <== must be a string and can not be empty).`,
        );
      });

      itProp('works with previously empty', fc.string(), condition => {
        fc.pre(!_.isEmpty(_.trim(condition)));
        updater.params.ConditionExpression = undefined;
        updater.condition(condition);
        expect(updater.params.ConditionExpression).toBe(condition);
      });

      itProp('works with previously existing', fc.string(), condition => {
        fc.pre(!_.isEmpty(_.trim(condition)));
        updater.params.ConditionExpression = 'previous';
        updater.condition(condition);
        expect(updater.params.ConditionExpression).toBe(`previous AND ${condition}`);
      });

      itProp('works with nondefault concatenation', [fc.string(), fc.string()], (condition, concat) => {
        fc.pre(!_.isEmpty(_.trim(condition)));
        updater.params.ConditionExpression = 'previous';
        updater.condition(condition, concat);
        expect(updater.params.ConditionExpression).toBe(`previous ${concat} ${condition}`);
      });
    });

    describe.each`
      functionName  | allowedValues                                                   | parameterName
      ${'return'}   | ${['NONE', 'ALL_OLD', 'UPDATED_OLD', 'ALL_NEW', 'UPDATED_NEW']} | ${'ReturnValues'}
      ${'capacity'} | ${['INDEXES', 'TOTAL', 'NONE']}                                 | ${'ReturnConsumedCapacity'}
      ${'metrics'}  | ${['NONE', 'SIZE']}                                             | ${'ReturnItemCollectionMetrics'}
    `('$functionName', ({ functionName, allowedValues, parameterName }) => {
      itProp('throws on disallowed inputs', fc.string(), str => {
        fc.pre(!allowedValues.includes(str.toUpperCase()));
        expect(() => updater[functionName](str)).toThrow(
          `DbUpdater.${functionName}("${str.toUpperCase()}" <== is not a valid value). Only ${allowedValues.join(
            ',',
          )} are allowed.`,
        );
      });

      itProp('sets the param on legal input', fc.constantFrom(...allowedValues), str => {
        updater[functionName](str);
        expect(updater.params[parameterName]).toBe(str);
      });

      itProp('sets the param allowing for differences in casing', fc.constantFrom(...allowedValues), str => {
        updater[functionName](str.toLowerCase());
        expect(updater.params[parameterName]).toBe(str);
      });
    });

    describe('.update', () => {
      let expectedResponse;
      beforeEach(() => {
        expectedResponse = {
          Attributes: {},
        };
        updater.client.update = jest.fn().mockReturnValue({ promise: () => Promise.resolve(expectedResponse) });
      });

      it('calls with the expected params (empty version)', async () => {
        await updater.update();
        expect(updater.client.update).toHaveBeenCalledWith({ ReturnValues: 'ALL_NEW' });
      });

      it('calls with the expected params (full version)', async () => {
        updater.set('setTestExpr');
        updater.add('addTestExpr');
        updater.remove('removeTestExpr');
        updater.delete('deleteTestExpr');
        await updater.update();
        expect(updater.client.update).toHaveBeenCalledWith({
          UpdateExpression: 'SET setTestExpr ADD addTestExpr REMOVE removeTestExpr DELETE deleteTestExpr',
          ReturnValues: 'ALL_NEW',
        });
      });
    });

    describe('.asTransactionItem', () => {
      it('creates the expected structure', () => {
        updater.set('setTestExpr');
        updater.add('addTestExpr');
        updater.remove('removeTestExpr');
        updater.delete('deleteTestExpr');

        expect(updater.asTransactionItem()).toEqual({
          Update: {
            UpdateExpression: 'SET setTestExpr ADD addTestExpr REMOVE removeTestExpr DELETE deleteTestExpr',
            ReturnValues: 'ALL_NEW',
          },
        });
      });
    });
  });
});
