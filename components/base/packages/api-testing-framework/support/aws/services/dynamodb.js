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

const _ = require('lodash');

const Scanner = require('./db-helpers/scanner');
const Updater = require('./db-helpers/updater');
const Getter = require('./db-helpers/getter');
const Query = require('./db-helpers/query');
const Deleter = require('./db-helpers/deleter');
const unmarshal = require('./db-helpers/unmarshal');

const { registerTables } = require('../../../lib/aws/register-tables');

class DynamoDb {
  constructor({ aws, sdk }) {
    this.aws = aws;
    this.sdk = sdk;
  }

  async init() {
    // Setting convertEmptyValues = true below, without this, if any item is asked to be updated with any attrib containing empty string
    // the dynamo update operation fails with
    // "ExpressionAttributeValues contains invalid value: One or more parameter values were invalid: An AttributeValue may not contain an empty string for key :desc" error
    // See https://github.com/aws/aws-sdk-js/issues/833 for details
    this.client = new this.aws.sdk.DynamoDB.DocumentClient({
      convertEmptyValues: true,
    });

    this.helpers = {
      unmarshal,
      scanner: () => new Scanner(console, this.client),
      updater: () => new Updater(console, this.client),
      getter: () => new Getter(console, this.client),
      query: () => new Query(console, this.client),
      deleter: () => new Deleter(console, this.client),
    };

    await this.registerTables();
  }

  async registerTables() {
    const { registry, tables } = await registerTables({ dynamoDb: this });
    this.registry = registry;
    this.tables = tables;
    this.tableNames = _.map(this.tables, (table) => table.fullName);
  }
}

// The aws javascript sdk client name
DynamoDb.clientName = 'DynamoDB';

// The framework is expecting this method. This is how the framework registers your aws services.
async function registerServices({ registry }) {
  registry.set('dynamoDb', DynamoDb);
}

module.exports = { registerServices };
