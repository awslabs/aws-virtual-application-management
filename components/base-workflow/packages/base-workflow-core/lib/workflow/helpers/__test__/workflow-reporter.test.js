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

import WorkflowReporter from '../workflow-reporter';

describe('WorkflowReporter', () => {
  let workflowReporter;
  let workflowInstanceMock;
  let logMock;
  let workflowInstanceServiceMock;

  const testInstanceId = 'test-wfInstance-id';
  const testWfId = 'test-wfInstance-wf-id';
  beforeEach(async () => {
    workflowInstanceMock = { id: testInstanceId, wf: { id: testWfId } };
    logMock = { info: jest.fn(), error: jest.fn() };
    workflowInstanceServiceMock = {
      changeWorkflowStatus: jest.fn(() => {
        return { msg: 'test - change step status success' };
      }),
    };
    workflowReporter = new WorkflowReporter({
      workflowInstance: workflowInstanceMock,
      log: logMock,
      workflowInstanceService: workflowInstanceServiceMock,
    });

    // eslint-disable-next-line no-console
    console.log = jest.fn();
  });

  describe('workflowStarted', () => {
    it('should get workflow started', async () => {
      // BUILD
      const instanceId = workflowInstanceMock.id;
      const workflowId = workflowInstanceMock.wf.id;

      // OPERATE
      const result = await workflowReporter.workflowStarted();

      // CHECK
      expect(workflowReporter.instanceService.changeWorkflowStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          workflowId,
          instanceId,
          status: 'in_progress',
        }),
      );
      expect(result).toStrictEqual({ msg: 'test - change step status success' });
    });
  });

  describe('workflowPaused', () => {
    it('should pause workflow', async () => {
      // BUILD
      const instanceId = workflowInstanceMock.id;
      const workflowId = workflowInstanceMock.wf.id;
      // OPERATE
      const result = await workflowReporter.workflowPaused();

      // CHECK
      expect(workflowReporter.instanceService.changeWorkflowStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          workflowId,
          instanceId,
          status: 'paused',
        }),
      );
      expect(result).toStrictEqual({ msg: 'test - change step status success' });
    });
  });

  describe('workflowResuming', () => {
    it('should resume workflow', async () => {
      // BUILD
      const instanceId = workflowInstanceMock.id;
      const workflowId = workflowInstanceMock.wf.id;
      // OPERATE
      const result = await workflowReporter.workflowResuming();

      // CHECK
      expect(workflowReporter.instanceService.changeWorkflowStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          workflowId,
          instanceId,
          status: 'in_progress',
        }),
      );
      expect(result).toStrictEqual({ msg: 'test - change step status success' });
    });
  });

  describe('workflowPassed', () => {
    it('should handle if workflow pass', async () => {
      // BUILD
      const instanceId = workflowInstanceMock.id;
      const workflowId = workflowInstanceMock.wf.id;
      // OPERATE
      const result = await workflowReporter.workflowPassed();

      // CHECK
      expect(workflowReporter.instanceService.changeWorkflowStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          workflowId,
          instanceId,
          status: 'done',
        }),
      );
      expect(result).toStrictEqual({ msg: 'test - change step status success' });
    });
  });

  describe('workflowFailed', () => {
    it('should handle if workflow failed', async () => {
      // BUILD
      const instanceId = workflowInstanceMock.id;
      const workflowId = workflowInstanceMock.wf.id;
      const error = { msg: 'custom error msg for testing' };
      // OPERATE
      const result = await workflowReporter.workflowFailed(error);

      // CHECK
      expect(workflowReporter.instanceService.changeWorkflowStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          workflowId,
          instanceId,
          status: 'error',
          message: error.msg,
        }),
      );
      expect(result).toStrictEqual({ msg: 'test - change step status success' });
    });
  });
});
