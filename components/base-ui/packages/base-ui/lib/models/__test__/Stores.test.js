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

import _ from 'lodash/fp';
import { itProp, fc } from 'jest-fast-check';
import Stores from '../Stores';

describe('Stores', () => {
  const toStores = _.map(tuple => {
    return { ready: tuple[0], reloading: tuple[1], load: jest.fn() };
  });

  describe('constructor', () => {
    itProp('sets stores to parameter with all empty / nil elements removed', fc.array(fc.anything()), stores => {
      const filterEmptyNil = _.filter(a => !(_.isEmpty(a) || _.isNil(a)));
      const storesObject = new Stores(stores);
      expect(storesObject.stores).toStrictEqual(filterEmptyNil(storesObject.stores));
    });
  });

  describe('ready', () => {
    itProp('returns true iff all stores are ready', fc.array(fc.tuple(fc.boolean(), fc.boolean())), tuples =>
      expect(new Stores(toStores(tuples)).ready).toBe(_.every(tuple => tuple[0] || tuple[1])(tuples)),
    );
  });

  describe('loading', () => {
    itProp('returns true iff any store is loading', fc.array(fc.boolean()), loadings => {
      const storesObject = new Stores(
        loadings.map(loading => {
          return { loading };
        }),
      );
      expect(storesObject.loading).toBe(_.some(_.identity)(loadings));
    });
  });

  describe('error and hasError', () => {
    itProp('returns true iff any store has error', fc.array(fc.option(fc.boolean())), errors => {
      const storesObject = new Stores(
        errors.map(error => {
          return { error };
        }),
      );
      const expected = _.some(error => error !== null && error)(errors);
      expect(storesObject.error).toBe(expected || undefined);
      expect(storesObject.hasError).toBe(expected);
    });
  });

  describe('load', () => {
    itProp(
      'loads any store that is not ready and swallows error',
      fc.array(fc.tuple(fc.boolean(), fc.boolean())),
      tuples => {
        const isStoreReady = store => store.ready || store.reloading;
        const stores = toStores(tuples);
        const storesObject = new Stores(stores);
        storesObject.load();
        _.forEach(store => expect(store.load).toHaveBeenCalledTimes(isStoreReady(store) ? 0 : 1))(stores);
      },
    );
  });
});
