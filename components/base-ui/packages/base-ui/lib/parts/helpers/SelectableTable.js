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
import React, { Component } from 'react';
import { Table, Checkbox } from 'semantic-ui-react';
import { observable, runInAction } from 'mobx';
import { observer } from 'mobx-react';

// expected props
// - headerRenderer (via props), A method that returns an array that will be rendered into the header cells
// - rowRenderer (via props), A method that returns an array that will be rendered into the row's cells
// - keyMethod (via props), A method that returns a unique identifier for that particular row
// - rowData (via props), the data to be rendered
// - valueMethod (via props), a method that returns the value that is to be associated with the row (set as the Checkbox value)

class SelectableTable extends Component {
  constructor(props) {
    super(props);
    this.componentStore = observable({
      values: props.defaultValue || [],
    });
  }

  render() {
    const { rowData, keyMethod, rowRenderer, headerRenderer, valueMethod } = this.props;
    return (
      <Table celled data-testid={this.props['data-testid']}>
        {this.renderHeader(headerRenderer)}
        <Table.Body>
          {rowData.map((row, index) => {
            let key = index;
            if (keyMethod) {
              key = keyMethod(row);
            }
            const value = valueMethod(row);
            const selected = this.componentStore.values.indexOf(value) !== -1;
            return (
              <TableRow
                key={key}
                data={row}
                rowIndex={index}
                rowRenderer={rowRenderer}
                value={value}
                selected={selected}
                onChange={(e, data) => {
                  this.handleChange({ value: data.value, selected: data.checked });
                }}
              />
            );
          })}
        </Table.Body>
      </Table>
    );
  }

  handleChange({ value, selected }) {
    const vals = this.componentStore.values;
    runInAction(() => {
      if (selected) {
        if (!vals.find(v => v === value)) {
          vals.push(value);
        }
      } else {
        vals.remove(value);
      }
    });
    this.props.onChange({ value: this.componentStore.values.slice() });
  }

  handleAllChange(selected) {
    const { rowData, valueMethod } = this.props;
    runInAction(() => {
      if (selected) {
        this.componentStore.values.replace(
          rowData.map(data => {
            return valueMethod(data);
          }),
        );
      } else {
        this.componentStore.values.clear();
      }
    });
    this.props.onChange({ value: this.componentStore.values.slice() });
  }

  renderHeader(renderer) {
    if (renderer) {
      const allSelected = this.componentStore.values.length === this.props.rowData.length;

      return (
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell key="select-cell" collapsing>
              <Checkbox checked={allSelected} onChange={(e, data) => this.handleAllChange(data.checked)} />
            </Table.HeaderCell>
            {renderer().map((cell, index) => {
              // eslint-disable-next-line react/no-array-index-key
              return <Table.HeaderCell key={index}>{cell}</Table.HeaderCell>;
            })}
          </Table.Row>
        </Table.Header>
      );
    }
    return null;
  }
}

const TableRow = ({ rowRenderer, data, rowIndex, value, selected, onChange }) => {
  let rowData = data;
  if (rowRenderer) {
    rowData = rowRenderer(data, rowIndex);
  }

  return (
    <Table.Row>
      <Table.Cell key="select-cell" collapsing textAlign="center">
        <Checkbox value={value} checked={selected} onChange={onChange} />
      </Table.Cell>
      {rowData.map((cell, index) => {
        // eslint-disable-next-line react/no-array-index-key
        return <Table.Cell key={index}>{cell}</Table.Cell>;
      })}
    </Table.Row>
  );
};

export default observer(SelectableTable);
