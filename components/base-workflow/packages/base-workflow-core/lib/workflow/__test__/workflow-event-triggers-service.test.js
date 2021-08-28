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

import WorkflowEventTriggersService from '../workflow-event-triggers-service';
import ServicesContainerMock from '../../__mocks__/services-container.mock';
import SettingsServiceMock from '../../__mocks__/settings-service.mock';
import DbServiceMock from '../../__mocks__/db-service';

const settings = {
  tableName: 'test-tableName',
  workflowSolutionEventsHandlerArn: 'test-workflowSolutionEventsHandlerArn',
};

describe('WorkflowEventTriggersService', () => {
  let service;
  let container;
  let jsonSchemaValidationService;
  let auditWriterService;
  let eventBridgeService;
  let dbService;
  const ruleTargetId = 'test-target-id';
  beforeEach(async () => {
    service = new WorkflowEventTriggersService();
    dbService = new DbServiceMock();
    // Initialize services container and register dependencies
    jsonSchemaValidationService = {
      ensureValid: jest.fn().mockResolvedValue(true),
    };
    auditWriterService = { writeAndForget: jest.fn() };
    eventBridgeService = {
      createRule: jest.fn(),
      createRuleTarget: jest.fn(() => {
        return { id: ruleTargetId };
      }),
      deleteRuleTarget: jest.fn(),
      deleteRule: jest.fn(),
    };

    container = new ServicesContainerMock({
      service,
      jsonSchemaValidationService,
      settings: new SettingsServiceMock(settings),
      dbService,
      auditWriterService,
      eventBridgeService,
    });

    await container.initServices();
    service.audit = jest.fn();
    service.mustFind = jest.fn(() => {
      return { targetIds: [{}] };
    });
  });

  describe('create', () => {
    it('should create workflow event trigger when no id is provided', async () => {
      // BUILD
      const requestContextMock = { principalIdentifier: { uid: 'test-uid' }, principal: { isAdmin: true } };
      const rawData = { workflowId: 'test-workflowId', workflowVer: 'test-workflowVer', eventPattern: {} };

      // OPERATE
      const result = await service.create(requestContextMock, rawData);

      // CHECK
      expect(eventBridgeService.createRuleTarget).toHaveBeenCalled();
      expect(service.audit).toHaveBeenCalledWith(
        requestContextMock,
        expect.objectContaining({ action: 'create-workflow-event-trigger' }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          id: expect.stringContaining('wetr-'),
          createdBy: requestContextMock.principalIdentifier.uid,
          targetIds: [ruleTargetId],
          updatedBy: requestContextMock.principalIdentifier.uid,
          wf: rawData.workflowId,
          workflowVer: rawData.workflowVer,
        }),
      );
    });

    it('should create workflow event trigger when an id is provided', async () => {
      // BUILD
      const requestContextMock = { principalIdentifier: { uid: 'test-uid' }, principal: { isAdmin: true } };
      const rawData = {
        id: 'test-id',
        workflowId: 'test-workflowId',
        workflowVer: 'test-workflowVer',
        eventPattern: {},
      };

      // OPERATE
      const result = await service.create(requestContextMock, rawData);

      // CHECK
      expect(eventBridgeService.createRuleTarget).toHaveBeenCalled();
      expect(service.audit).toHaveBeenCalledWith(
        requestContextMock,
        expect.objectContaining({ action: 'create-workflow-event-trigger' }),
      );
      expect(result).toEqual(
        expect.objectContaining({
          id: 'test-id',
          createdBy: requestContextMock.principalIdentifier.uid,
          targetIds: [ruleTargetId],
          updatedBy: requestContextMock.principalIdentifier.uid,
          wf: rawData.workflowId,
          workflowVer: rawData.workflowVer,
        }),
      );
    });
  });

  describe('delete', () => {
    it('should delete workflow event trigger', async () => {
      // BUILD
      const requestContextMock = {
        principalIdentifier: { uid: 'test-uid' },
        principal: { isAdmin: true },
      };
      service
        ._updater()
        .key({ id: 'test-delete-id' })
        .item({ id: 'test-delete-id', key: 'test-delete-key' })
        .update();

      // OPERATE
      const result = await service.delete(requestContextMock, {
        id: 'test-delete-id',
      });

      // CHECK
      expect(eventBridgeService.deleteRuleTarget).toHaveBeenCalled();
      expect(service.audit).toHaveBeenCalledWith(
        requestContextMock,
        expect.objectContaining({
          action: 'delete-workflow-event-trigger',
        }),
      );
      expect(result).toStrictEqual({
        id: 'test-delete-id',
        key: 'test-delete-key',
      });
    });
  });
});
