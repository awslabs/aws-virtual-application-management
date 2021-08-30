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
import getEditWorkflowDraftMetaForm from '../EditWorkflowDraftMetaForm';

describe('EditWorkflowDraftMetaForm', () => {
  describe('getEditWorkflowDraftMetaForm', () => {
    it('should return a mobx react form', () => {
      const template = {
        title: '',
        desc: '',
        instanceTtl: '',
        runSpec: {},
        canOverrideProp: jest.fn(() => {
          return 'override message';
        }),
      };
      const result = getEditWorkflowDraftMetaForm(template);
      expect(result).toBeInstanceOf(MobxReactForm);
    });
  });
});
