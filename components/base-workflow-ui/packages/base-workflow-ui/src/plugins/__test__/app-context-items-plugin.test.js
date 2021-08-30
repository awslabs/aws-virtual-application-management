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

import plugin from '../app-context-items-plugin';

describe('plugin', () => {
  const appContext = {};
  describe('registerAppContextItems', () => {
    it('should register app context items', () => {
      plugin.registerAppContextItems(appContext);
      expect(appContext).toHaveProperty('stepTemplatesStore');
      expect(appContext).toHaveProperty('workflowTemplateDraftsStore');
      expect(appContext).toHaveProperty('workflowTemplatesStore');
      expect(appContext).toHaveProperty('workflowDraftsStore');
      expect(appContext).toHaveProperty('workflowsStore');
    });
  });
});
