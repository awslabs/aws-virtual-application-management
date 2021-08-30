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

/* eslint-disable no-loop-func */
/* eslint-disable no-continue */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
const _ = require('lodash');
const path = require('path');

const { invokeMethodInFile } = require('../helpers/invoke-method');
const { Registry } = require('../helpers/registry');
const { Table } = require('./table');

/**
 * For each tests dir, look for support/aws/tables.js, if it exists and it exports tableNames() function,
 * then call this method. The tableNames() function is expected to return an array of strings representing the
 * table names.
 *
 * Returns the populated registry and tables which is a map of table names and their Table instances
 */
async function registerTables({ dynamoDb }) {
  const aws = dynamoDb.aws;
  const { dependencyGraph } = aws;
  const registry = new Registry();
  // For each tests dir, look for support/aws/tables.js, if it exists and if it exports
  // 'tableNames()' function, then call the function
  for (const node of dependencyGraph) {
    const testsDir = node.testsDir;
    const file = path.join(testsDir, 'support/aws/tables.js');

    // invokeMethodInFile knows how to find the file and the method
    await invokeMethodInFile({ file, methodName: 'tableNames' }, async (method) => {
      const source = { name: node.name, file };

      // Call the tableNames() exported by the tables.js file
      const tableNames = await method();

      // We register the table names in the registry
      registry.merge(_.keyBy(tableNames), source);
    });
  }

  const tableEntries = _.keys(registry.entries());
  const tables = {};

  // We create a Table instance per table name
  _.forEach(tableEntries, (name) => {
    tables[name] = new Table({ dynamoDb, name });
  });

  return { registry, tables };
}

module.exports = { registerTables };
