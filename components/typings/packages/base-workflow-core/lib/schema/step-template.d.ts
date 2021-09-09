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

export type Markdown = string;
export type ManifestCondition = null | string;
export type InputEntryManifest = ManifestEntrySegment | ManifestEntryInput;

export interface StepTemplateSchema {
  id: string;
  v: number;
  title: string;
  desc: Markdown;
  skippable: boolean;
  src?: {
    lambdaArn: string;
    pluginId: string;
  };
  adminInputManifest?: InputManifest;
  inputManifest?: InputManifest;
  hidden: boolean;
}
export interface InputManifest {
  sections?: InputSectionManifest[];
  [k: string]: unknown;
}
export interface InputSectionManifest {
  title?: string;
  condition?: ManifestCondition;
  children: InputEntryManifest[];
  [k: string]: unknown;
}
export interface ManifestEntrySegment {
  name?: string;
  type: "segment";
  condition?: ManifestCondition;
  raised?: boolean;
  basic?: boolean;
  ribbon?: {
    title?: string;
    color?: string;
  };
  children: InputEntryManifest[];
  [k: string]: unknown;
}
export interface ManifestEntryInput {
  name: string;
  type:
    | "yesNoInput"
    | "stringInput"
    | "dropDownInput"
    | "textAreaInput"
    | "userSelectionInput"
    | "workflowSelectionInput";
  condition?: ManifestCondition;
  title: string;
  desc?: Markdown;
  rules?: string;
  nonInteractive?: boolean;
  sensitive?: boolean;
  divider?: {
    title?: string;
    icon?: string;
  };
  yesLabel?: string;
  noLabel?: string;
  options?: unknown[];
  extra?: {
    [k: string]: unknown;
  };
  [k: string]: unknown;
}