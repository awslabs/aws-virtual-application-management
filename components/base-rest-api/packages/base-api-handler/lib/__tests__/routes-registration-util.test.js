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

import { registerRoutes } from '../routes-registration-util';

describe('routes-registration-util', () => {
  describe('.registerRoutes', () => {
    it('returns empty with no plugins', async done => {
      const pluginRegistry = {
        getPlugins: jest.fn().mockResolvedValue([]),
      };
      const result = await registerRoutes(undefined, undefined, pluginRegistry);
      expect(result).toEqual([]);
      done();
    });

    it('returns empty when plugin has no routes', async done => {
      const pluginRegistry = {
        getPlugins: jest.fn().mockResolvedValue([
          {
            getRoutes: jest.fn(),
          },
        ]),
      };
      const result = await registerRoutes(undefined, undefined, pluginRegistry);
      expect(result).toEqual([]);
      done();
    });

    it('it adds the route but not the router', async done => {
      const router = { use: jest.fn() };
      const pluginRegistry = {
        getPlugins: jest.fn().mockResolvedValue([
          {
            getRoutes: jest.fn().mockReturnValue(new Map([['/routeurl', [jest.fn().mockResolvedValue()]]])),
          },
        ]),
      };
      const result = await registerRoutes(undefined, router, pluginRegistry);
      expect(router.use).not.toHaveBeenCalled();
      expect(result).toEqual(['/routeurl']);
      done();
    });

    it('returns the route and registers the router', async done => {
      const router = { use: jest.fn() };
      const mockChildRouter = { child: 'router' };
      const pluginRegistry = {
        getPlugins: jest.fn().mockResolvedValue([
          {
            getRoutes: jest
              .fn()
              .mockReturnValue(new Map([['/routeurl', [jest.fn().mockResolvedValue(mockChildRouter)]]])),
          },
        ]),
      };
      const result = await registerRoutes(undefined, router, pluginRegistry);
      expect(router.use).toHaveBeenCalledWith('/routeurl', mockChildRouter);
      expect(result).toEqual(['/routeurl']);
      done();
    });
  });
});
