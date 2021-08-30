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

import type { SettingsService as ISettingsService } from '@aws-ee/base-services-container';

export default SettingsService;
declare class SettingsService implements ISettingsService {
  constructor(settings: any);
  get entries(): Record<string, unknown>;
  set<T = unknown>(key: string, value: T): void;
  get<T = string>(key: string): T;
  getObject<T = unknown>(key: string): T;
  getBoolean(key: string): boolean;
  getNumber(key: string): number;
  optional<T = string>(key: string, defaultValue: T): T;
  optionalObject<T = unknown>(key: string, defaultValue: T): T;
  optionalNumber(key: string, defaultValue: number): number;
  optionalBoolean(key: string, defaultValue: boolean): boolean;
}
