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
import WorkflowTemplateDraftPublisher from '../WorkflowTemplateDraftPublisher';

jest.mock('../../../../workflow-common/component-states/WorkflowCommonCardState');
jest.mock('../../../WorkflowTemplateCardTabs');
describe('WorkflowTemplateDraftPublisher', () => {
  it('WorkflowTemplateDraftPublisher should renders correctly', () => {
    const uiEventBus = {};
    const onCancel = jest.fn();
    const editor = { draft: { template: { propertyOverrideSummaryRows: [] } }, metaForm: {} };
    expect(
      renderer
        .create(
          <Provider>
            <WorkflowTemplateDraftPublisher.WrappedComponent
              onCancel={onCancel}
              editor={editor}
              uiEventBus={uiEventBus}
            />
          </Provider>,
        )
        .toJSON(),
    ).toMatchSnapshot();
  });
});
