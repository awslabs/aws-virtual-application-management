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

/* eslint-disable no-console */
import StepReporter from '../step-reporter';

describe('StepReporter', () => {
  let stepReporter;
  let workflowReporterMock;
  let stepMock;
  const testInstanceId = 'test-wfInstance-id';
  const testIndex = 'test-step-index';
  beforeEach(async () => {
    workflowReporterMock = { wfInstance: { id: testInstanceId } };
    stepMock = { index: testIndex };
    const workflowInstanceServiceMock = {
      changeStepStatus: jest.fn(() => {
        return { msg: 'test - change step status success' };
      }),
    };
    stepReporter = new StepReporter({
      workflowReporter: workflowReporterMock,
      step: stepMock,
      workflowInstanceService: workflowInstanceServiceMock,
    });

    console.log = jest.fn();
    console.info = jest.fn();
    console.error = jest.fn();
  });

  describe('stepStarted', () => {
    it('should get step started', async () => {
      // BUILD
      const instanceId = workflowReporterMock.wfInstance.id;
      const stepIndex = stepMock.index;
      // OPERATE
      const result = await stepReporter.stepStarted();

      // CHECK
      expect(stepReporter.instanceService.changeStepStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          instanceId,
          stepIndex,
          step: stepMock,
          wfInstance: workflowReporterMock.wfInstance,
          status: 'in_progress',
        }),
      );
      expect(result).toStrictEqual({ msg: 'test - change step status success' });
    });
  });

  describe('stepSkipped', () => {
    it('should skip step', async () => {
      // BUILD
      const instanceId = workflowReporterMock.wfInstance.id;
      const stepIndex = stepMock.index;
      // OPERATE
      const result = await stepReporter.stepSkipped();

      // CHECK
      expect(stepReporter.instanceService.changeStepStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          instanceId,
          stepIndex,
          step: stepMock,
          wfInstance: workflowReporterMock.wfInstance,
          status: 'skipped',
        }),
      );
      expect(result).toStrictEqual({ msg: 'test - change step status success' });
    });
  });

  describe('stepPaused', () => {
    it('should pause step', async () => {
      // BUILD
      const instanceId = workflowReporterMock.wfInstance.id;
      const stepIndex = stepMock.index;
      // OPERATE
      const result = await stepReporter.stepPaused();

      // CHECK
      expect(stepReporter.instanceService.changeStepStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          instanceId,
          stepIndex,
          step: stepMock,
          wfInstance: workflowReporterMock.wfInstance,
          status: 'paused',
        }),
      );
      expect(result).toStrictEqual({ msg: 'test - change step status success' });
    });
  });

  describe('stepResumed', () => {
    it('should resume step', async () => {
      // BUILD
      const instanceId = workflowReporterMock.wfInstance.id;
      const stepIndex = stepMock.index;
      // OPERATE
      const result = await stepReporter.stepResumed();

      // CHECK
      expect(stepReporter.instanceService.changeStepStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          instanceId,
          stepIndex,
          step: stepMock,
          wfInstance: workflowReporterMock.wfInstance,
          status: 'in_progress',
        }),
      );
      expect(result).toStrictEqual({ msg: 'test - change step status success' });
    });
  });

  describe('stepMaxPauseReached', () => {
    it('should handle max step Pause Reached', async () => {
      // BUILD
      const instanceId = workflowReporterMock.wfInstance.id;
      const stepIndex = stepMock.index;
      // OPERATE
      const result = await stepReporter.stepMaxPauseReached();

      // CHECK
      expect(stepReporter.instanceService.changeStepStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          instanceId,
          stepIndex,
          step: stepMock,
          wfInstance: workflowReporterMock.wfInstance,
          status: 'in_progress',
        }),
      );
      expect(result).toStrictEqual({ msg: 'test - change step status success' });
    });
  });

  describe('stepPassed', () => {
    it('should handle if step pass', async () => {
      // BUILD
      const instanceId = workflowReporterMock.wfInstance.id;
      const stepIndex = stepMock.index;
      // OPERATE
      const result = await stepReporter.stepPassed();

      // CHECK
      expect(stepReporter.instanceService.changeStepStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          instanceId,
          stepIndex,
          step: stepMock,
          wfInstance: workflowReporterMock.wfInstance,
          status: 'done',
        }),
      );
      expect(result).toStrictEqual({ msg: 'test - change step status success' });
    });
  });

  describe('stepFailed', () => {
    it('should handle if step failed', async () => {
      // BUILD
      const instanceId = workflowReporterMock.wfInstance.id;
      const stepIndex = stepMock.index;
      const error = { msg: 'custom error msg for testing' };
      // OPERATE
      const result = await stepReporter.stepFailed(error);

      // CHECK
      expect(stepReporter.instanceService.changeStepStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          instanceId,
          stepIndex,
          step: stepMock,
          wfInstance: workflowReporterMock.wfInstance,
          status: 'error',
          message: error.msg,
        }),
      );
      expect(result).toStrictEqual({ msg: 'test - change step status success' });
    });
  });

  describe('statusMessage', () => {
    it('should return status message', async () => {
      // BUILD
      const instanceId = workflowReporterMock.wfInstance.id;
      const stepIndex = stepMock.index;
      const message = { msg: 'custom msg for testing' };
      // OPERATE
      const result = await stepReporter.statusMessage(message);

      // CHECK
      expect(stepReporter.instanceService.changeStepStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          instanceId,
          stepIndex,
          step: stepMock,
          wfInstance: workflowReporterMock.wfInstance,
          message,
        }),
      );
      expect(result).toStrictEqual({ msg: 'test - change step status success' });
    });
  });

  describe('clearStatusMessage', () => {
    it('should return status message', async () => {
      // BUILD
      const instanceId = workflowReporterMock.wfInstance.id;
      const stepIndex = stepMock.index;
      // OPERATE
      const result = await stepReporter.clearStatusMessage();

      // CHECK
      expect(stepReporter.instanceService.changeStepStatus).toHaveBeenCalledWith(
        expect.objectContaining({
          instanceId,
          stepIndex,
          step: stepMock,
          wfInstance: workflowReporterMock.wfInstance,
          clearMessage: true,
        }),
      );
      expect(result).toStrictEqual({ msg: 'test - change step status success' });
    });
  });
});
