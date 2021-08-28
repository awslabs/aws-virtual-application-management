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
import { Provider } from 'mobx-react';
import WorkflowCommonDraftCard from '../WorkflowCommonDraftCard';

describe('WorkflowCommonDraftCard', () => {
  const onCancel = jest.fn();
  const editor = { version: { selectedSteps: [] }, addStep: jest.fn(), stepEditorsEditing: jest.fn() };
  const stepEditor = {};
  const stepTemplatesStore = { load: jest.fn() };
  const userDisplayName = {
    getDisplayName: jest.fn(() => {
      return 'test-name';
    }),
  };

  beforeEach(() => {
    jest.spyOn(global.Date, 'now').mockImplementation(() => 1626365860332);
  });

  const draft = { template: {}, workflow: {}, createdAt: 'Feb 1, 1966 UTC', createdBy: 'test' };
  it('renders correctly', () =>
    expect(
      renderer
        .create(
          <Provider userDisplayName={userDisplayName} stepTemplatesStore={stepTemplatesStore}>
            <WorkflowCommonDraftCard
              draft={draft}
              editor={editor}
              stepEditor={stepEditor}
              onCancel={onCancel}
              StepTemplatesStore={stepTemplatesStore}
            />
          </Provider>,
        )
        .toJSON(),
    ).toMatchSnapshot());
});
