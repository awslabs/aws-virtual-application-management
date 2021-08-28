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

import React from 'react';
import renderer from 'react-test-renderer';
import BarGraph from '../BarGraph';
import { blueDatasets } from '../graph-options';

jest.mock('react-chartjs-2', () => ({ HorizontalBar: () => null }));

describe('BarGraph', () => {
  it('renders correctly', () => {
    const title = 'Tasks';
    const data = {
      labels: ['Eat', 'Run', 'Walk', 'Sleep', 'Work'],
      datasets: blueDatasets(title, [1, 8, 5, 6, 3]),
    };
    const barGraph = renderer.create(<BarGraph className="mr4" data={data} title="Tasks" />).toJSON();
    expect(barGraph).toMatchSnapshot();
  });
});
