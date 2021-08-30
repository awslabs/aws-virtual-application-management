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
import WorkflowTemplateCard from '../WorkflowTemplateCard';

describe('WorkflowTemplateCard', () => {
  const template = {
    getVersion: jest.fn(() => {
      return { id: 'test-id', v: 1, title: 'test-title', createdAt: 'Feb 1, 1966 UTC', createdBy: 'test' };
    }),
    versionNumbers: [1],
    latest: { v: 1 },
  };
  const v = 1;
  const userDisplayName = {
    isSystem: jest.fn(() => {
      return true;
    }),
    getDisplayName: jest.fn(() => {
      return 'test-displayname';
    }),
  };

  beforeEach(() => {
    jest.spyOn(global.Date, 'now').mockImplementation(() => 1626365860332);
  });

  it('WorkflowTemplateCard should renders correctly', () =>
    expect(
      renderer
        .create(
          <Provider userDisplayName={userDisplayName}>
            <WorkflowTemplateCard.WrappedComponent template={template} v={v} userDisplayName={userDisplayName} />
          </Provider>,
        )
        .toJSON(),
    ).toMatchSnapshot());
});
