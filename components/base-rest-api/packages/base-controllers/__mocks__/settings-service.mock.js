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

import { Service } from '@aws-ee/base-services-container';

class SettingsServiceMock extends Service {
  constructor(settings) {
    super();
    this._mockSettings = settings;
  }

  get(key) {
    return this._mockSettings[key];
  }

  getObject(key) {
    return this.get(key);
  }

  getBoolean(key) {
    return this.get(key);
  }

  optional(key, defaultValue) {
    return this.get(key) || defaultValue;
  }

  optionalObject(key, defaultValue) {
    return this.get(key) || defaultValue;
  }

  setTemp(key, value) {
    this._originals = {};
    this._originals[key] = this._mockSettings[key];
    this._mockSettings[key] = value;
  }

  clearTemp() {
    this._mockSettings = { ...this._mockSettings, ...(this._originals || {}) };
  }
}

export default SettingsServiceMock;
