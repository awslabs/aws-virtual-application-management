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

import WorkflowStep from '../WorkflowStep';

describe('WorkflowStep', () => {
  const workflowStep = WorkflowStep.create({
    id: 'test-workflowStep',
    stepTemplateId: 'test-stepTemplateId',
    stepTemplateVer: 1,
    title: 'test-title',
    desc: 'test-description',
    propsOverrideOption: {},
    configOverrideOption: {},
    skippable: true,
    configs: {},
  });
  describe('WorkflowStep action test', () => {
    it('should created workflowStep', () => {
      expect(workflowStep.id).toEqual('test-workflowStep');
    });

    it('should setDesc', () => {
      expect(workflowStep.desc).toEqual('test-description');
      workflowStep.setDesc('new-test-workflowstep-desc');
      expect(workflowStep.desc).toEqual('new-test-workflowstep-desc');
    });

    it('should setTitle', () => {
      expect(workflowStep.title).toEqual('test-title');
      workflowStep.setTitle('new-test-title');
      expect(workflowStep.title).toEqual('new-test-title');
    });

    it('should setSkippable', () => {
      expect(workflowStep.skippable).toEqual(true);
      workflowStep.setSkippable(false);
      expect(workflowStep.skippable).toEqual(false);
    });
  });

  describe('WorkflowStep views test', () => {
    it('should get templateId', () => {
      const result = workflowStep.templateId;
      expect(result).toEqual('test-stepTemplateId');
    });

    it('should get templateVer', () => {
      const result = workflowStep.templateVer;
      expect(result).toEqual(1);
    });

    it('should get desc', () => {
      const result = workflowStep.propertySummaryRows;
      expect(result).toEqual([{ title: 'Skip this step if pervious steps failed', value: false }]);
    });
  });
});
