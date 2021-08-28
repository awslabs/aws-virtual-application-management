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
import controller from '../workflow-template-controller';

describe('workflow-template-controller', () => {
  let context;
  let workflowTemplateService;
  let workflowTemplateDraftService;
  let router;
  beforeEach(async () => {
    workflowTemplateService = {
      createVersion: jest.fn(),
      listVersions: jest.fn(),
      list: jest.fn(),
      mustFindVersion: jest.fn(),
    };
    workflowTemplateDraftService = {
      updateDraft: jest.fn(),
      list: jest.fn(),
      createDraft: jest.fn(),
      publishDraft: jest.fn(),
      deleteDraft: jest.fn(),
    };
    context = createContext({ workflowTemplateService, workflowTemplateDraftService });
    router = await controller(context);
  });

  describe('GET /drafts', () => {
    itProp('get list of workflow template draft', [fc.object(), fc.string()], async (result, userId) => {
      workflowTemplateDraftService.list.mockResolvedValue(result);
      const request = {};
      const response = {
        locals: { requestContext: { principalIdentifier: { uid: userId } } },
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      await router.invoke('GET', '/drafts', request, response);
      expect(workflowTemplateDraftService.list).toHaveBeenCalledWith(response.locals.requestContext);
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(result);
    });
  });

  describe('GET /', () => {
    itProp('gets latest list all version of workflow template', [fc.object(), fc.string()], async (result, userId) => {
      workflowTemplateService.listVersions.mockResolvedValue(result);
      const request = {};
      const response = {
        locals: { requestContext: { principalIdentifier: { uid: userId } } },
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      await router.invoke('GET', '/', request, response);
      expect(workflowTemplateService.listVersions).toHaveBeenCalled();
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(result);
    });
  });

  describe('GET /latest', () => {
    itProp('gets list of latest version of workflow templates', [fc.object(), fc.string()], async (result, userId) => {
      workflowTemplateService.list.mockResolvedValue(result);
      const request = {};
      const response = {
        locals: { requestContext: { principalIdentifier: { uid: userId } } },
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      await router.invoke('GET', '/latest', request, response);
      expect(workflowTemplateService.list).toHaveBeenCalledWith(response.locals.requestContext);
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(result);
    });
  });

  describe('GET /:id', () => {
    itProp(
      'gets list of version of workflow template when id is given',
      [fc.object(), fc.string(), fc.string()],
      async (result, paramId, userId) => {
        workflowTemplateService.listVersions.mockResolvedValue(result);
        const request = { params: { id: paramId } };
        const response = {
          locals: { requestContext: { principalIdentifier: { uid: userId } } },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await router.invoke('GET', '/:id', request, response);
        expect(workflowTemplateService.listVersions).toHaveBeenCalledWith(response.locals.requestContext, {
          id: request.params.id,
        });
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith(result);
      },
    );
  });

  describe('GET /:id/latest', () => {
    itProp(
      'gets latest version of workflow template when id is given',
      [fc.object(), fc.string(), fc.string()],
      async (result, paramId, userId) => {
        workflowTemplateService.mustFindVersion.mockResolvedValue(result);
        const request = { params: { id: paramId } };
        const response = {
          locals: { requestContext: { principalIdentifier: { uid: userId } } },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await router.invoke('GET', '/:id/latest', request, response);
        expect(workflowTemplateService.mustFindVersion).toHaveBeenCalledWith(response.locals.requestContext, {
          id: request.params.id,
        });
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith(result);
      },
    );
  });

  describe('GET /:id/v/:v', () => {
    itProp(
      'get specific version of workflow when workflow id and version are given',
      [fc.object(), fc.string(), fc.string(), fc.string()],
      async (result, paramId, paramV, userId) => {
        workflowTemplateService.mustFindVersion.mockResolvedValue(result);
        const request = { params: { id: paramId, v: paramV } };
        const response = {
          locals: { requestContext: { principalIdentifier: { uid: userId } } },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await router.invoke('GET', '/:id/v/:v', request, response);
        expect(workflowTemplateService.mustFindVersion).toHaveBeenCalledWith(response.locals.requestContext, {
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
      'create a version of workflow when workflow id is given',
      [fc.object(), fc.string(), fc.string()],
      async (result, paramId, userId) => {
        const manifest = { id: paramId };
        workflowTemplateService.createVersion.mockResolvedValue(result);
        const request = { params: { id: paramId }, body: manifest };
        const response = {
          locals: { requestContext: { principalIdentifier: { uid: userId } } },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await router.invoke('POST', '/:id/v/', request, response);
        expect(workflowTemplateService.createVersion).toHaveBeenCalledWith(response.locals.requestContext, manifest);
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith(result);
      },
    );
  });

  describe('POST /drafts', () => {
    itProp(
      'create a workflow template drafts',
      [fc.object(), fc.string(), fc.string(), fc.object()],
      async (result, paramId, userId, possibleBody) => {
        workflowTemplateDraftService.createDraft.mockResolvedValue(result);
        const request = { params: { id: paramId }, body: possibleBody };
        const response = {
          locals: { requestContext: { principalIdentifier: { uid: userId } } },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await router.invoke('POST', '/drafts', request, response);
        expect(workflowTemplateDraftService.createDraft).toHaveBeenCalledWith(
          response.locals.requestContext,
          possibleBody,
        );
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith(result);
      },
    );
  });

  describe('POST /drafts/publish', () => {
    itProp(
      'should publish a workflow template draft',
      [fc.object(), fc.string(), fc.object()],
      async (result, userId, draft) => {
        workflowTemplateDraftService.publishDraft.mockResolvedValue(result);
        const request = { body: draft };
        const response = {
          locals: { requestContext: { principalIdentifier: { uid: userId } } },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await router.invoke('POST', '/drafts/publish', request, response);
        expect(workflowTemplateDraftService.publishDraft).toHaveBeenCalledWith(response.locals.requestContext, draft);
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith(result);
      },
    );
  });

  describe('PUT /drafts/:id', () => {
    itProp(
      'should update a workflow template draft when id is given',
      [fc.object(), fc.string(), fc.string()],
      async (result, userId, paramId) => {
        const draft = { id: paramId };
        workflowTemplateDraftService.updateDraft.mockResolvedValue(result);
        const request = { params: { id: paramId }, body: draft };
        const response = {
          locals: { requestContext: { principalIdentifier: { uid: userId } } },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await router.invoke('PUT', '/drafts/:id', request, response);
        expect(workflowTemplateDraftService.updateDraft).toHaveBeenCalledWith(response.locals.requestContext, draft);
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith(result);
      },
    );
  });

  describe('DELETE /drafts/:id', () => {
    itProp(
      'should delete a workflow template draft when id is given',
      [fc.string(), fc.string()],
      async (userId, paramId) => {
        const request = { params: { id: paramId } };
        const response = {
          locals: { requestContext: { principalIdentifier: { uid: userId } } },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await router.invoke('DELETE', '/drafts/:id', request, response);
        expect(workflowTemplateDraftService.deleteDraft).toHaveBeenCalledWith(response.locals.requestContext, {
          id: paramId,
        });
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith({});
      },
    );
  });
});
