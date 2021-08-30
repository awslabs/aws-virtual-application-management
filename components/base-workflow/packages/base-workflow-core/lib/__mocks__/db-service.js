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

/* eslint-disable max-classes-per-file */
import { Service } from '@aws-ee/base-services-container';

class HelperBase {
  constructor(dbService) {
    this.dbService = dbService;
  }

  table(tableName) {
    this.tableName = tableName;
    return this;
  }

  key(key, value) {
    if (value === undefined) {
      this.keyValue = key;
    } else {
      this.keyValue = { [key]: value };
    }
    return this;
  }

  names(key, value) {
    if (value === undefined) {
      this.name = key;
    } else {
      this.name = { [key]: value };
    }
    return this;
  }

  values(key, value) {
    if (value === undefined) {
      this.value = key;
    } else {
      this.value = { [key]: value };
    }
    return this;
  }
}

class GetterMock extends HelperBase {
  projection(fields) {
    this.projectionFields = fields;
    return this;
  }

  async get() {
    return this.dbService.getItem(this.tableName, this.keyValue);
  }
}

class ScannerMock extends HelperBase {
  projection(fields) {
    this.projectionFields = fields;
    return this;
  }

  scan() {
    return this.dbService.scan(this.tableName);
  }

  limit() {
    return this;
  }

  scanPage() {
    return this;
  }
}

class UpdaterMock extends HelperBase {
  item(itemToUpdate) {
    this.itemToUpdate = itemToUpdate;
    return this;
  }

  async update() {
    this.dbService.putItem(this.tableName, this.keyValue, this.itemToUpdate);
    return this.itemToUpdate;
  }

  set() {
    return this;
  }

  condition() {
    return this;
  }

  rev() {
    return this;
  }

  remove() {
    return this;
  }

  updatedAt() {
    return this;
  }

  disableCreatedAt() {
    return this;
  }
}

class QueryMock extends HelperBase {
  index() {
    return this;
  }

  async query() {
    return this.dbService.query(this.tableName, this.keyValue);
  }

  sortKey() {
    return this;
  }

  between() {
    return this;
  }

  projection() {
    return this;
  }

  gt() {
    return this;
  }

  forward() {
    return this;
  }

  limit() {
    return this;
  }

  filter() {
    return this;
  }
}

class DeleterMock extends HelperBase {
  condition() {
    return this;
  }

  async delete() {
    return this.dbService.deleteItem(this.tableName, this.keyValue);
  }
}

/**
 * In-memory DynamoDB for unit testing
 */
class DbServiceMock extends Service {
  async init() {
    this.database = {};
    this.helper = {
      getter: () => new GetterMock(this),
      updater: () => new UpdaterMock(this),
      scanner: () => new ScannerMock(this),
      query: () => new QueryMock(this),
      deleter: () => new DeleterMock(this),
    };
  }

  putItem(table, key, item) {
    this._ensureTable(table);
    this.database[table][JSON.stringify(key)] = item;
  }

  getItem(table, key) {
    this._ensureTable(table);
    return this.database[table][JSON.stringify(key)];
  }

  deleteItem(table, key) {
    this._ensureTable(table);
    return this.database[table][JSON.stringify(key)];
  }

  scan(table) {
    this._ensureTable(table);
    return Object.values(this.database[table]);
  }

  query(table, key) {
    return this.scan(table).filter(item => Object.keys(key).every(keyField => item[keyField] === key[keyField]));
  }

  _ensureTable(table) {
    if (!this.database[table]) {
      this.database[table] = {};
    }
  }
}

export default DbServiceMock;
