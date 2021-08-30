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
import AuthorizationService from '../authorization-service';
import PluginRegistryService from '../../plugin-registry/plugin-registry-service';

// TODO: only happy path testing for now, revisit later
describe('AuthorizationService', () => {
  let container;
  let sut;
  let mockAuditPlugin;

  beforeEach(async () => {
    container = new ServicesContainer();
    mockAuditPlugin = {
      authorize: jest.fn(() => ({ effect: 'testEffect', reason: 'testReason' })),
    };
    const pluginRegistry = {
      getPlugins: () => Promise.resolve([mockAuditPlugin]),
    };
    container.register('log', { initService: jest.fn(), warn: jest.fn() });
    container.register('pluginRegistryService', new PluginRegistryService(pluginRegistry));
    container.register('sut', new AuthorizationService());
    await container.initServices();
    sut = await container.find('sut');
  });

  describe('.authorize', () => {
    it('authorizes', async () => {
      const ctx = {};
      const result = await sut.authorize(ctx, {});
      expect(result).toEqual({ effect: 'testEffect', reason: 'testReason' });
    });
  });

  describe('.assertAuthorized', () => {
    it('denies in this case', async () => {
      const ctx = {};
      try {
        await sut.assertAuthorized(ctx, {});
      } catch (err) {
        expect({ ...err }).toEqual({ boom: true, code: 'forbidden', safe: true, status: 403 });
        return;
      }
      throw new Error('Expected an exception');
    });
  });
});
