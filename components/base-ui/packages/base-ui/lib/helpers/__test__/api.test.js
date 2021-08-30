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
import _ from 'lodash/fp';
import {
  addUser,
  config,
  configure,
  fetchJson,
  forgetIdToken,
  getDecodedIdToken,
  httpApiDelete,
  logout,
  setIdToken,
  updateUser,
  setApiPaths,
  getApiPaths,
  getApiPath,
} from '../api';

const options = {
  cache: 'no-cache',
  headers: { 'Accept': 'application/json', 'Authorization': 'undefined', 'Content-Type': 'application/json' },
  mode: 'cors',
  redirect: 'follow',
};

const spyFetch = () => {
  global.fetch = () => {
    return {
      a: 'b',
    };
  };
  return jest.spyOn(global, 'fetch');
};

describe('api', () => {
  describe('setIdToken, getDecodedIdToken, forgetIdToken', () => {
    itProp('sets, gets and forgets decoded ID token', [fc.string()], a => {
      setIdToken(_, a);
      expect(getDecodedIdToken()).toBe(a);
      forgetIdToken();
      expect(getDecodedIdToken()).toBeUndefined();
    });
  });

  describe('setApiPaths, getApiPaths, getApiPath', () => {
    itProp(
      'sets and gets api paths',
      [fc.domain({ minLength: 1 }), fc.string({ minLength: 1 }), fc.string({ minLength: 1 })],
      (a, b, c) => {
        // Intentionally using `domain` for the route as it excludes characters that will form bad patterns
        const o = [
          {
            route: a,
            apiPath: b,
          },
        ];
        setApiPaths(o);
        expect(getApiPaths()).toMatchObject(o);
        expect(getApiPath(a)).toBe(b);
        expect(getApiPath(c)).toBeUndefined();
        const empty = [];
        setApiPaths(empty);
        expect(getApiPaths()).toEqual(empty);
      },
    );
  });

  describe('configure', () => {
    itProp('adds the parameter to config', [fc.object()], a => {
      configure(a);
      expect(config).toMatchObject({ ...config, ...a });
    });
  });

  describe('fetchJson', () => {
    itProp(
      'returns fetched object using global fetch',
      [fc.string(), fc.string(), fc.string(), fc.string(), fc.string()],
      async (a, b, c, d, url) => {
        const o = {
          [a]: b,
        };
        const merged = {
          params: {
            [c]: d,
          },
        };
        global.fetch = () => o;
        const spy = jest.spyOn(global, 'fetch');
        await expect(fetchJson(url, merged)).resolves.toMatchObject(o);
        expect(spy).toHaveBeenCalledWith(`${url}?${encodeURIComponent(c)}=${encodeURIComponent(d)}`, {
          ...options,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          method: 'GET',
        });
      },
    );
    it('throws error when fetched JSON is invalid', async () => {
      global.fetch = () => '{ foo, bar, }';
      await expect(fetchJson()).rejects.toMatchObject(new Error('The server did not return a json response.'));
    });
  });

  describe('addUser', () => {
    itProp(
      'calls fetch with the correct parameters',
      [fc.string({ minLength: 1 }), fc.string({ minLength: 1 })],
      async (authenticationProviderId, identityProviderName) => {
        const spy = spyFetch();
        await addUser({ authenticationProviderId, identityProviderName });
        expect(spy).toHaveBeenCalledWith(
          `undefined/api/users?authenticationProviderId=${encodeURIComponent(
            authenticationProviderId,
          )}&identityProviderName=${encodeURIComponent(identityProviderName)}`,
          {
            body: JSON.stringify({
              authenticationProviderId,
              identityProviderName,
            }),
            ...options,
            method: 'POST',
          },
        );
      },
    );
  });

  describe('updateUser', () => {
    itProp(
      'calls fetch with the correct parameters',
      [fc.string({ minLength: 1 }), fc.string({ minLength: 1 })],
      async (authenticationProviderId, identityProviderName) => {
        const spy = spyFetch();
        await updateUser({ authenticationProviderId, identityProviderName });
        expect(spy).toHaveBeenCalledWith('undefined/api/users/undefined', {
          ...options,
          body: '{}',
          method: 'PUT',
        });
      },
    );
  });

  describe('httpApiDelete', () => {
    itProp(
      'calls fetch with the correct parameters',
      [fc.string({ minLength: 1 }), fc.string({ minLength: 1 })],
      async (urlPath, data, params) => {
        const spy = spyFetch();
        await httpApiDelete(urlPath, { data, params });
        expect(spy).toHaveBeenCalledWith(`undefined/${urlPath}`, {
          ...options,
          body: JSON.stringify(data),
          method: 'DELETE',
          params: undefined,
        });
      },
    );

    itProp(
      'calls fetch with the correct parameters after api paths have been set',
      [fc.domain({ minLength: 1 }), fc.string({ minLength: 1 }), fc.string({ minLength: 1 })],
      async (urlPath, data, apiPath) => {
        // Intentionally using `domain` for the route as it excludes characters that will form bad patterns
        const o = [
          {
            route: urlPath,
            apiPath,
          },
        ];
        setApiPaths(o);
        const spy = spyFetch();
        await httpApiDelete(urlPath, { data });
        expect(spy).toHaveBeenCalledWith(`${apiPath}/${urlPath}`, {
          ...options,
          body: JSON.stringify(data),
          method: 'DELETE',
          params: undefined,
        });
      },
    );
  });

  describe('logout', () => {
    it('returns the correct parameters when token is expired', async () => {
      expect(logout()).toMatchObject({ expired: true, revoked: false });
    });
  });
});
