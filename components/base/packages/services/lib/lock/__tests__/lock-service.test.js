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

import { ServicesContainer } from '@aws-ee/base-services-container';
import LockService from '../lock-service';
import DbService from '../../__mocks__/db-service';

// TODO: only happy path testing for now, revisit later
describe('LockService', () => {
  let container;
  let sut;
  let dbService;

  beforeEach(async () => {
    container = new ServicesContainer();
    dbService = new DbService();
    container.register('dbService', dbService);
    container.register('settings', { initService: jest.fn(), get: () => 'testTable' });
    container.register('jsonSchemaValidationService', { initService: jest.fn(), ensureValid: jest.fn() });
    container.register('sut', new LockService());
    await container.initServices();
    sut = await container.find('sut');
  });

  describe('.obtainWriteLock', () => {
    it('obtains a write lock', async () => {
      const result = await sut.obtainWriteLock({ id: 'testId', expiresIn: 1234 });

      expect(result).toEqual('testId');
      expect(dbService.table.condition).toHaveBeenCalledWith('attribute_not_exists(id) OR #ttl < :now ');
      expect(dbService.table.key).toHaveBeenCalledWith('id', 'testId');
      expect(dbService.table.names).toHaveBeenCalledWith({ '#ttl': 'ttl' });
      expect(dbService.table.values).toHaveBeenCalledWith({ ':now': expect.any(Number) });
      expect(dbService.table.item).toHaveBeenCalledWith({
        ttl: expect.any(Number),
      });
      expect(dbService.table.update).toHaveBeenCalled();
    });
  });

  describe('.releaseWriteLock', () => {
    it('releases a write lock', async () => {
      await sut.releaseWriteLock({ writeToken: 'testToken' });

      expect(dbService.table.condition).toHaveBeenCalledWith('attribute_exists(id)');
      expect(dbService.table.key).toHaveBeenCalledWith('id', 'testToken');
      expect(dbService.table.delete).toHaveBeenCalled();
    });
  });
});
