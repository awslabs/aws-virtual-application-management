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
import AuditWriterService from '../audit-writer-service';
import PluginRegistryService from '../../plugin-registry/plugin-registry-service';

describe('AuditWriterService', () => {
  let container;
  let sut;
  let mockAuditPlugin;

  beforeEach(async () => {
    container = new ServicesContainer();
    mockAuditPlugin = {
      prepare: jest.fn(payload => payload),
      write: jest.fn(payload => payload),
    };
    const pluginRegistry = {
      getPlugins: () => Promise.resolve([mockAuditPlugin]),
    };
    container.register('pluginRegistryService', new PluginRegistryService(pluginRegistry));
    container.register('sut', new AuditWriterService());
    await container.initServices();
    sut = await container.find('sut');
  });

  describe('.write', () => {
    describe.each`
      inputAuditEvent                                 | expectedAuditEvent
      ${{ otherField: 'test' }}                       | ${{ otherField: 'test', actor: 'userIdFromContext', timestamp: expect.any(Number) }}
      ${{ action: 'testAction' }}                     | ${{ message: 'testAction', actor: 'userIdFromContext', action: 'testAction', timestamp: expect.any(Number) }}
      ${{ action: 'testAction', message: 'testMsg' }} | ${{ message: 'testMsg', actor: 'userIdFromContext', action: 'testAction', timestamp: expect.any(Number) }}
      ${{ actor: 'testActor' }}                       | ${{ actor: 'testActor', timestamp: expect.any(Number) }}
      ${{ timestamp: 1234 }}                          | ${{ timestamp: 1234, actor: 'userIdFromContext' }}
    `('for $inputAuditEvent', ({ inputAuditEvent, expectedAuditEvent }) => {
      it('calls the plugin as expected', async () => {
        const ctx = { request: 'context', principalIdentifier: { uid: 'userIdFromContext' } };
        await sut.write(ctx, inputAuditEvent, 'arg0', 'arg1');
        expect(mockAuditPlugin.prepare).toHaveBeenCalledWith(
          { auditEvent: expectedAuditEvent, container, requestContext: ctx },
          'arg0',
          'arg1',
        );
        expect(mockAuditPlugin.write).toHaveBeenCalledWith(
          { auditEvent: expectedAuditEvent, container, requestContext: ctx },
          'arg0',
          'arg1',
        );
      });
    });

    it('returns the status', async () => {
      const ctx = { request: 'context' };
      const auditEvent = { audit: 'event' };
      const expectedTransformedEvent = {
        ...auditEvent,
        timestamp: expect.any(Number),
      };
      const result = await sut.write(ctx, auditEvent, 'arg0', 'arg1');
      expect(result).toEqual({ auditEvent: expectedTransformedEvent, status: 'success' });
    });

    describe('.writeAndForget', () => {
      it('returns unknown status', async () => {
        const ctx = { request: 'context' };
        const auditEvent = { audit: 'event' };
        const result = await sut.writeAndForget(ctx, auditEvent, 'arg0', 'arg1');
        expect(result).toEqual({ status: 'unknown' });
      });
    });
  });
});
