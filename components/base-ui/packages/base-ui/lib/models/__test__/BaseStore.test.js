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
import {
  isStoreReady,
  isStoreEmpty,
  isStoreNotEmpty,
  isStoreLoading,
  isStoreReloading,
  isStoreNew,
  isStoreError,
} from '../BaseStore';

describe('BaseStore', () => {
  itProp(
    'boolean functions return values corresponding to ready, reloading, empty, error and initial',
    [fc.boolean(), fc.boolean(), fc.boolean(), fc.boolean(), fc.boolean(), fc.boolean()],
    (ready, loading, reloading, empty, error, initial) => {
      const obj = { ready, loading, reloading, empty, error, initial };
      const readyOrReloading = ready || reloading;
      expect(isStoreReady(obj)).toBe(readyOrReloading);
      expect(isStoreEmpty(obj)).toBe(readyOrReloading && empty);
      expect(isStoreNotEmpty(obj)).toBe(readyOrReloading && !empty);
      expect(isStoreLoading(obj)).toBe(loading);
      expect(isStoreReloading(obj)).toBe(reloading);
      expect(isStoreNew(obj)).toBe(initial);
      expect(isStoreError(obj)).toBe(error);
    }, //
  );
});
