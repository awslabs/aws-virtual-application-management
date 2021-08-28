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

// import _ from 'lodash/fp';
// import { itProp, fc } from 'jest-fast-check';
import { registerContextItems } from '../StepTemplatesStore';
import { getStepTemplates } from '../../../helpers/api';

jest.mock('../../../helpers/api');

describe('StepTemplatesStore', () => {
  let store = null;
  const appContext = {};
  const newVersions = [{ id: 'test-version-id', param: {} }];

  beforeEach(async () => {
    await registerContextItems(appContext);
    store = appContext.stepTemplatesStore;
    getStepTemplates.mockResolvedValueOnce(newVersions);
    await store.load();
  });

  describe('store', () => {
    it('should contain a version as initialized', async () => {
      const list = store.list;
      // CHECK
      expect(store.empty).toBe(false);
      expect(store.total).toEqual(1);
      expect(list[0].id).toEqual('test-version-id');
    });
    it('should remove versions via cleanup', async () => {
      await store.cleanup();
      expect(store.empty).toBe(true);
    });
  });
});
