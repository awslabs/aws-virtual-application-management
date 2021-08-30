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
import React from 'react';
import { Table } from 'semantic-ui-react';

// expected props
// - headerRenderer (via props), A method that returns an array that will be rendered into the header cells
// - rowRenderer (via props), A method that returns an array that will be rendered into the row's cells
// - keyMethod (via props), A method that returns a unique identifier for that particular row
// - rowData (via props), the data to be rendered

// Example usage
/*
<SimpleTable
  headerRenderer={() => {
    return ['Exhibit ID', 'Offence', 'Case', 'Strike Force', 'Created', 'File Count', ''];
  }}
  rowRenderer={exhibit => {
    const createdAt = moment(exhibit.createdAt).format('DD/MM/YYYY HH:mm');
    return [
      exhibit.friendlyId,
      exhibit.offence,
      exhibit.case,
      exhibit.strikeForce,
      createdAt,
      exhibit.fileCount,
      this.renderExhibitActions(exhibit),
    ];
  }}
  rowData={exhibits}
  keyMethod={exhibit => exhibit.id}
/>
*/

const SimpleTable = ({ rowData, keyMethod, rowRenderer, headerRenderer, 'data-testid': dataTestId }) => {
  return (
    <Table celled data-testid={dataTestId}>
      {renderHeader(headerRenderer)}
      <Table.Body>
        {rowData.map((row, index) => {
          let key = index;
          if (keyMethod) {
            key = keyMethod(row);
          }
          return <TableRow key={key} data={row} rowIndex={index} rowRenderer={rowRenderer} />;
        })}
      </Table.Body>
    </Table>
  );
};

const renderHeader = renderer => {
  if (renderer) {
    return (
      <Table.Header>
        <Table.Row>
          {renderer().map((cell, index) => {
            // eslint-disable-next-line react/no-array-index-key
            return <Table.HeaderCell key={index}>{cell}</Table.HeaderCell>;
          })}
        </Table.Row>
      </Table.Header>
    );
  }
  return null;
};

const TableRow = ({ rowRenderer, data, rowIndex }) => {
  let rowData = data;
  if (rowRenderer) {
    rowData = rowRenderer(data, rowIndex);
  }
  return (
    <Table.Row>
      {rowData.map((cell, index) => {
        // eslint-disable-next-line react/no-array-index-key
        return <Table.Cell key={index}>{cell}</Table.Cell>;
      })}
    </Table.Row>
  );
};

export default SimpleTable;
