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

/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

import { RunSpec } from "./runspec";

type Markdown = string;

export interface WorkflowTemplate {
  id: string;
  v: number;
  title: string;
  desc?: Markdown;
  hidden?: boolean;
  builtin?: boolean;
  selectedSteps: SelectedStepTemplate[];
  propsOverrideOption: OverrideOption;
  instanceTtl?: null | number;
  runSpec?: RunSpec;
}
export interface SelectedStepTemplate {
  stepTemplateId: string;
  stepTemplateVer: number;
  propsOverrideOption?: OverrideOption;
  configOverrideOption?: OverrideOption;
  title?: string;
  desc?: Markdown;
  skippable?: boolean;
  defaults?: {
    [k: string]: unknown;
  };
  id: string;
}
export interface OverrideOption {
  allowed?: string[];
  [k: string]: unknown;
}

