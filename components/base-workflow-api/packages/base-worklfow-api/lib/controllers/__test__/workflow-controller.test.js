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

import { itProp, fc } from 'jest-fast-check';
import createContext from '../../../__mocks__/context.mock';
import controller from '../workflow-controller';

describe('workflow-controller', () => {
  let context;
  let workflowService;
  let workflowDraftService;
  let workflowInstanceService;
  let workflowTriggerService;
  let workflowEventTriggersService;
  let router;
  let settings;
  beforeEach(async () => {
    workflowService = {
      createVersion: jest.fn(),
      listVersions: jest.fn(),
      list: jest.fn(),
      mustFindVersion: jest.fn(),
    };
    workflowDraftService = {
      createDraft: jest.fn(),
      list: jest.fn(),
      publishDraft: jest.fn(),
      updateDraft: jest.fn(),
      deleteDraft: jest.fn(),
    };
    workflowInstanceService = { list: jest.fn(), listByStatus: jest.fn(), mustFindInstance: jest.fn() };
    workflowTriggerService = { triggerWorkflow: jest.fn() };
    workflowEventTriggersService = { listByWorkflow: jest.fn(), create: jest.fn(), delete: jest.fn() };
    context = createContext({
      workflowService,
      workflowDraftService,
      workflowInstanceService,
      workflowTriggerService,
      workflowEventTriggersService,
    });
    router = await controller(context);
    settings = context.settings;
  });

  describe('POST /:id/v/:v/trigger', () => {
    itProp(
      'should trigger workflow with workflow id and version given',
      [fc.object(), fc.string(), fc.string(), fc.string(), fc.object(), fc.object()],
      async (result, userId, paramId, paramV, input, meta) => {
        settings.put('smWorkflow', 'test-smWorkflow');
        workflowTriggerService.triggerWorkflow.mockResolvedValue(result);
        const request = {
          params: { id: paramId, v: paramV },
          body: {
            input,
            meta,
          },
        };
        const response = {
          locals: { requestContext: { principalIdentifier: { uid: userId } } },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await router.invoke('POST', '/:id/v/:v/trigger', request, response);
        expect(workflowTriggerService.triggerWorkflow).toHaveBeenCalledWith(
          response.locals.requestContext,
          meta,
          input,
        );
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith(result);
      },
    );
  });

  describe('GET /:id/v/:v/instances', () => {
    itProp(
      'gets list of workflow instance with workflow id and version given',
      [fc.object(), fc.string(), fc.string(), fc.string()],
      async (result, userId, paramId, paramV) => {
        workflowInstanceService.list.mockResolvedValue(result);
        const request = { params: { id: paramId, v: paramV } };
        const response = {
          locals: { requestContext: { principalIdentifier: { uid: userId } } },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await router.invoke('GET', '/:id/v/:v/instances', request, response);
        expect(workflowInstanceService.list).toHaveBeenCalledWith(response.locals.requestContext, {
          workflowId: paramId,
          workflowVer: paramV,
        });
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith(result);
      },
    );
  });

  describe('GET /:id/v/:v/instances/:instanceId', () => {
    itProp(
      'gets workflow instance with workflow id, version and instanceId given',
      [fc.object(), fc.string(), fc.string()],
      async (result, userId, instanceId) => {
        workflowInstanceService.mustFindInstance.mockResolvedValue(result);
        const request = { params: { instanceId } };
        const response = {
          locals: { requestContext: { principalIdentifier: { uid: userId } } },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await router.invoke('GET', '/:id/v/:v/instances/:instanceId', request, response);
        expect(workflowInstanceService.mustFindInstance).toHaveBeenCalledWith(response.locals.requestContext, {
          id: instanceId,
        });
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith(result);
      },
    );
  });

  describe('POST /instances/status/:status', () => {
    itProp(
      'fetch list workflow instance by workflow status, start time and end time',
      [fc.object(), fc.string(), fc.string(), fc.string(), fc.string()],
      async (result, userId, status, startTime, endTime) => {
        workflowInstanceService.listByStatus.mockResolvedValue(result);
        const request = { params: { status }, body: { startTime, endTime } };
        const response = {
          locals: { requestContext: { principalIdentifier: { uid: userId } } },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await router.invoke('POST', '/instances/status/:status', request, response);
        expect(workflowInstanceService.listByStatus).toHaveBeenCalledWith(response.locals.requestContext, {
          status,
          startTime,
          endTime,
        });
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith(result);
      },
    );
  });

  describe('GET /:id/event-triggers', () => {
    itProp(
      'get workflow event list with worklow id given',
      [fc.object(), fc.string(), fc.string()],
      async (result, userId, workflowId) => {
        workflowEventTriggersService.listByWorkflow.mockResolvedValue(result);
        const request = { params: { id: workflowId } };
        const response = {
          locals: { requestContext: { principalIdentifier: { uid: userId } } },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await router.invoke('GET', '/:id/event-triggers', request, response);
        expect(workflowEventTriggersService.listByWorkflow).toHaveBeenCalledWith(response.locals.requestContext, {
          workflowId,
        });
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith(result);
      },
    );
  });

  describe('POST /:id/event-triggers', () => {
    itProp(
      'create workflow event with worklow id given',
      [fc.object(), fc.string(), fc.object()],
      async (result, userId, body) => {
        workflowEventTriggersService.create.mockResolvedValue(result);
        const request = { body };
        const response = {
          locals: { requestContext: { principalIdentifier: { uid: userId } } },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await router.invoke('POST', '/:id/event-triggers', request, response);
        expect(workflowEventTriggersService.create).toHaveBeenCalledWith(response.locals.requestContext, body);
        expect(response.status).toHaveBeenCalledWith(201);
        expect(response.json).toHaveBeenCalledWith(result);
      },
    );
  });

  describe('DELETE /:id/event-triggers/:eventTriggerId', () => {
    itProp(
      'delete workflow event trigger with eventTriggerId given',
      [fc.string(), fc.string()],
      async (userId, eventTriggerId) => {
        const request = { params: { eventTriggerId } };
        const response = {
          locals: { requestContext: { principalIdentifier: { uid: userId } } },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await router.invoke('DELETE', '/:id/event-triggers/:eventTriggerId', request, response);
        expect(workflowEventTriggersService.delete).toHaveBeenCalledWith(response.locals.requestContext, {
          id: eventTriggerId,
        });
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith({});
      },
    );
  });

  describe('GET /drafts', () => {
    itProp('get workflow event list with worklow id given', [fc.object(), fc.string()], async (result, userId) => {
      workflowDraftService.list.mockResolvedValue(result);
      const request = {};
      const response = {
        locals: { requestContext: { principalIdentifier: { uid: userId } } },
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      await router.invoke('GET', '/drafts', request, response);
      expect(workflowDraftService.list).toHaveBeenCalledWith(response.locals.requestContext);
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(result);
    });
  });

  describe('GET /', () => {
    itProp('get list of all versions of workflow', [fc.object(), fc.string()], async (result, userId) => {
      workflowService.listVersions.mockResolvedValue(result);
      const request = {};
      const response = {
        locals: { requestContext: { principalIdentifier: { uid: userId } } },
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      await router.invoke('GET', '/', request, response);
      expect(workflowService.listVersions).toHaveBeenCalledWith(response.locals.requestContext);
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(result);
    });
  });

  describe('GET /latest', () => {
    itProp(
      'get latest workflow list',
      [fc.record({ items: fc.option(fc.anything()) }), fc.string()],
      async (result, userId) => {
        workflowService.list.mockResolvedValue(result);
        const request = {};
        const response = {
          locals: { requestContext: { principalIdentifier: { uid: userId } } },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await router.invoke('GET', '/latest', request, response);
        expect(workflowService.list).toHaveBeenCalledWith(response.locals.requestContext, { maxResults: 500 });
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith(result.items);
      },
    );
  });

  describe('GET /:id', () => {
    itProp(
      'get list of versions workflow when workflow id is given',
      [fc.object(), fc.string(), fc.string()],
      async (result, paramId, userId) => {
        workflowService.listVersions.mockResolvedValue(result);
        const request = { params: { id: paramId } };
        const response = {
          locals: { requestContext: { principalIdentifier: { uid: userId } } },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await router.invoke('GET', '/:id', request, response);
        expect(workflowService.listVersions).toHaveBeenCalledWith(response.locals.requestContext, {
          id: paramId,
        });
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith(result);
      },
    );
  });

  describe('GET /:id/latest', () => {
    itProp(
      'gets latest version of workflow when workflowId is given',
      [fc.object(), fc.string(), fc.string()],
      async (result, paramId, userId) => {
        workflowService.mustFindVersion.mockResolvedValue(result);
        const request = { params: { id: paramId } };
        const response = {
          locals: { requestContext: { principalIdentifier: { uid: userId } } },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await router.invoke('GET', '/:id/latest', request, response);
        expect(workflowService.mustFindVersion).toHaveBeenCalledWith(response.locals.requestContext, {
          id: paramId,
        });
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith(result);
      },
    );
  });

  describe('GET /:id/v/:v', () => {
    itProp(
      'gets specific version of workflow when workflowId and version are given',
      [fc.object(), fc.string(), fc.string(), fc.string()],
      async (result, paramId, paramV, userId) => {
        workflowService.mustFindVersion.mockResolvedValue(result);
        const request = { params: { id: paramId, v: paramV } };
        const response = {
          locals: { requestContext: { principalIdentifier: { uid: userId } } },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await router.invoke('GET', '/:id/v/:v', request, response);
        expect(workflowService.mustFindVersion).toHaveBeenCalledWith(response.locals.requestContext, {
          id: paramId,
          v: paramV,
        });
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith(result);
      },
    );
  });

  describe('POST /:id/v/', () => {
    itProp(
      'create one version of workflow when workflowId is given',
      [fc.object(), fc.string(), fc.string()],
      async (result, paramId, userId) => {
        workflowService.createVersion.mockResolvedValue(result);
        const body = { id: paramId };
        const request = { params: { id: paramId }, body };
        const response = {
          locals: { requestContext: { principalIdentifier: { uid: userId } } },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await router.invoke('POST', '/:id/v/', request, response);
        expect(workflowService.createVersion).toHaveBeenCalledWith(response.locals.requestContext, request.body);
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith(result);
      },
    );
  });

  describe('POST /drafts', () => {
    itProp('create workflow drafts', [fc.object(), fc.object(), fc.string()], async (result, body, userId) => {
      workflowDraftService.createDraft.mockResolvedValue(result);
      const request = { body };
      const response = {
        locals: { requestContext: { principalIdentifier: { uid: userId } } },
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      await router.invoke('POST', '/drafts', request, response);
      expect(workflowDraftService.createDraft).toHaveBeenCalledWith(response.locals.requestContext, request.body);
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(result);
    });
  });

  describe('POST /drafts/publish', () => {
    itProp('should publish workflow drafts', [fc.object(), fc.string(), fc.string()], async (result, draft, userId) => {
      workflowDraftService.publishDraft.mockResolvedValue(result);
      const request = { body: draft };
      const response = {
        locals: { requestContext: { principalIdentifier: { uid: userId } } },
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      await router.invoke('POST', '/drafts/publish', request, response);
      expect(workflowDraftService.publishDraft).toHaveBeenCalledWith(response.locals.requestContext, draft);
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(result);
    });
  });

  describe('PUT /drafts/:id', () => {
    itProp(
      'should update workflow drafts with id given',
      [fc.object(), fc.string(), fc.string()],
      async (result, userId, paramId) => {
        const draft = { id: paramId };
        workflowDraftService.updateDraft.mockResolvedValue(result);
        const request = { params: { id: paramId }, body: draft };
        const response = {
          locals: { requestContext: { principalIdentifier: { uid: userId } } },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await router.invoke('PUT', '/drafts/:id', request, response);
        expect(workflowDraftService.updateDraft).toHaveBeenCalledWith(response.locals.requestContext, draft);
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith(result);
      },
    );
  });

  describe('DELETE /drafts/:id', () => {
    itProp(
      'should delete workflow drafts with id given',
      [fc.object(), fc.string(), fc.string()],
      async (result, userId, paramId) => {
        workflowDraftService.deleteDraft.mockResolvedValue(result);
        const request = { params: { id: paramId } };
        const response = {
          locals: { requestContext: { principalIdentifier: { uid: userId } } },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await router.invoke('DELETE', '/drafts/:id', request, response);
        expect(workflowDraftService.deleteDraft).toHaveBeenCalledWith(response.locals.requestContext, { id: paramId });
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith({});
      },
    );
  });
});
