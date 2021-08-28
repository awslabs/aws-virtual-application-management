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

import sidebars from '../sidebars';

describe('sidebars', () => {
  it('follows the correct format', () => {
    const visit = (entry) => {
      expect(typeof entry).toBe('object');
      expect(typeof entry.idx).toBe('number');
      if (entry.vals) {
        expect(typeof entry.vals).toBe('object');
        Object.values(entry.vals).forEach(visit);
      }
    };

    Object.values(sidebars).forEach(visit);
  });
});
