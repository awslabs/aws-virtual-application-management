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

const routeKey = (method, route) => `${method}|${route}`;

const createContext = serviceMap => ({
  router: () => ({
    routes: {},

    all(route, fn) {
      this.routes[routeKey('ALL', route)] = fn;
    },

    get(route, fn) {
      this.routes[routeKey('GET', route)] = fn;
    },

    put(route, fn) {
      this.routes[routeKey('PUT', route)] = fn;
    },

    post(route, fn) {
      this.routes[routeKey('POST', route)] = fn;
    },

    delete(route, fn) {
      this.routes[routeKey('DELETE', route)] = fn;
    },

    isRouteDefined(method, route) {
      return !!this.routes[routeKey(method, route)];
    },

    invoke(method, route, ...args) {
      return this.routes[routeKey(method, route)](...args);
    },
  }),
  service: async nameOrNames =>
    Array.isArray(nameOrNames) ? nameOrNames.map(name => serviceMap[name]) : serviceMap[nameOrNames],
  wrap(fn) {
    return async (req, res, next) => {
      await fn(req, res, next);
    };
  },
  boom: {},
});

export default createContext;
