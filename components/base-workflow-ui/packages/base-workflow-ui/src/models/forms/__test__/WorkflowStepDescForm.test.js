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

import MobxReactForm from 'mobx-react-form';
import getWorkflowStepDescForm from '../WorkflowStepDescForm';

describe('WorkflowStepDescForm', () => {
  describe('getWorkflowStepDescForm', () => {
    it('should return a mobx react form', () => {
      const step = {
        configOverrideSummaryRows: [
          {
            name: 'test-name',
            title: 'test-title',
            desc: 'test-desc',
            derivedTitle: 'test-derivedTitle',
            derivedDesc: 'test-derivedDesc',
            allowed: false,
            propsOverrideOption: { allowed: [] },
          },
        ],
      };
      const option = {};
      const result = getWorkflowStepDescForm(step, option);
      expect(result).toBeInstanceOf(MobxReactForm);
    });
  });
});
