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

import { StepBaseFromWorkflowEngine, WorkflowInstance } from '@aws-ee/workflow-engine';

export default StepBase;
declare class StepBase extends StepBaseFromWorkflowEngine {
  constructor({
    input,
    workflowInstance,
    workflowPayload,
    stepState,
    container,
    step,
    stepReporter,
    workflowStatus,
  }: {
    input: any;
    workflowInstance: any;
    workflowPayload: any;
    stepState: any;
    container: any;
    step: any;
    stepReporter: any;
    workflowStatus: any;
  });
  container: any;
  settings: any;
  input: any;
  workflowInstance: WorkflowInstance;
  workflowPayload: any;
  workflowStatus: any;
  state: any;
  step: any;
  reporter: any;

  initStep(): Promise<StepBase>;
  init(): Promise<StepBase>;

  mustFindServices<T>(name: string): Promise<T>;
  mustFindServices<T, U>(names: [string, string]): Promise<[T, U]>;
  mustFindServices<T, U, V>(names: [string, string, string]): Promise<[T, U, V]>;
  mustFindServices(names: string[]): Promise<unknown[]>;

  optionallyFindServices<T>(name: string): Promise<T | null>;
  optionallyFindServices<T, U>(names: [string, string]): Promise<[T?, U?]>;
  optionallyFindServices<T, U, V>(names: [string, string, string]): Promise<[T?, U?, V?]>;
  optionallyFindServices(names: string[]): Promise<unknown[]>;
  
  inputKeys(): Promise<Record<string, string> | undefined>;
  outputKeys(): Promise<Record<string, string> | undefined>;
  getStepInput(): Promise<Record<string, unknown> | undefined>;
  getStepOutput(): Promise<Record<string, unknown> | undefined>;
  getValues(keysMap: any): Promise<Record<string, unknown> | undefined>;
}
