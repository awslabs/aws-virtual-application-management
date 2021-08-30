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
import controller from '../step-template-controller';

describe('step-template-controller', () => {
  let context;
  let stepTemplateService;
  let router;
  beforeEach(async () => {
    stepTemplateService = {
      listVersions: jest.fn(),
      list: jest.fn(),
      mustFindVersion: jest.fn(),
      mustValidateVersion: jest.fn(),
    };
    context = createContext({ stepTemplateService });
    router = await controller(context);
  });

  describe('GET /', () => {
    itProp('gets version list of stepTemplate', [fc.object(), fc.string()], async (result, userId) => {
      stepTemplateService.listVersions.mockResolvedValue(result);
      const request = {};
      const response = {
        locals: { requestContext: { principalIdentifier: { uid: userId } } },
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      await router.invoke('GET', '/', request, response);
      expect(stepTemplateService.listVersions).toHaveBeenCalledWith(response.locals.requestContext);
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(result);
    });
  });

  describe('GET /latest', () => {
    itProp('gets latest list of step template', [fc.object(), fc.string()], async (result, userId) => {
      stepTemplateService.list.mockResolvedValue(result);
      const request = {};
      const response = {
        locals: { requestContext: { principalIdentifier: { uid: userId } } },
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
      await router.invoke('GET', '/latest', request, response);
      expect(stepTemplateService.list).toHaveBeenCalledWith(response.locals.requestContext);
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledWith(result);
    });
  });

  describe('GET /:id', () => {
    itProp(
      'gets version list of step template when id is given',
      [fc.object(), fc.string(), fc.string()],
      async (result, paramId, userId) => {
        stepTemplateService.listVersions.mockResolvedValue(result);
        const request = { params: { id: paramId } };
        const response = {
          locals: { requestContext: { principalIdentifier: { uid: userId } } },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await router.invoke('GET', '/:id', request, response);
        expect(stepTemplateService.listVersions).toHaveBeenCalledWith(response.locals.requestContext, {
          id: request.params.id,
        });
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith(result);
      },
    );
  });

  describe('GET /:id/latest', () => {
    itProp(
      'gets latest version of step template when id is given',
      [fc.object(), fc.string(), fc.string()],
      async (result, paramId, userId) => {
        stepTemplateService.mustFindVersion.mockResolvedValue(result);
        const request = { params: { id: paramId } };
        const response = {
          locals: { requestContext: { principalIdentifier: { uid: userId } } },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await router.invoke('GET', '/:id/latest', request, response);
        expect(stepTemplateService.mustFindVersion).toHaveBeenCalledWith(response.locals.requestContext, {
          id: request.params.id,
        });
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith(result);
      },
    );
  });

  describe('GET /:id/v/:v', () => {
    itProp(
      'gets specific version of step template when id and version are given',
      [fc.object(), fc.string(), fc.string(), fc.string()],
      async (result, paramId, paramV, userId) => {
        stepTemplateService.mustFindVersion.mockResolvedValue(result);
        const request = { params: { id: paramId, v: paramV } };
        const response = {
          locals: { requestContext: { principalIdentifier: { uid: userId } } },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await router.invoke('GET', '/:id/v/:v', request, response);
        expect(stepTemplateService.mustFindVersion).toHaveBeenCalledWith(response.locals.requestContext, {
          id: request.params.id,
          v: request.params.v,
        });
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith(result);
      },
    );
  });

  describe('POST /:id/v/:v/validate', () => {
    itProp(
      'validate specific version of step template when id and version are given',
      [fc.object(), fc.object(), fc.string(), fc.string(), fc.string()],
      async (result, config, paramId, paramV, userId) => {
        stepTemplateService.mustValidateVersion.mockResolvedValue(result);
        const request = { params: { id: paramId, v: paramV }, body: config };
        const response = {
          locals: { requestContext: { principalIdentifier: { uid: userId } } },
          status: jest.fn().mockReturnThis(),
          json: jest.fn(),
        };
        await router.invoke('POST', '/:id/v/:v/validate', request, response);
        expect(stepTemplateService.mustValidateVersion).toHaveBeenCalledWith(response.locals.requestContext, {
          id: paramId,
          v: paramV,
          config,
        });
        expect(response.status).toHaveBeenCalledWith(200);
        expect(response.json).toHaveBeenCalledWith(result);
      },
    );
  });
});
