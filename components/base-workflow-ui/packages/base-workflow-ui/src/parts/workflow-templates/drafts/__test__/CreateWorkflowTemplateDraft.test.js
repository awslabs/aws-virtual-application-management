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

import { Provider } from 'mobx-react';
import React from 'react';
import renderer from 'react-test-renderer';
import CreateWorkflowTemplateDraft from '../CreateWorkflowTemplateDraft';

// Mocking Description in base-ui to avoid coupling between sst versions
jest.mock('@aws-ee/base-ui/dist/parts/helpers/fields/Description', () => () => <div>Mocked description</div>);

describe('CreateWorkflowTemplateDraft', () => {
  const onCancel = jest.fn();
  const className = 'test-className';
  it('CreateWorkflowTemplateDraft should renders correctly', () => {
    const workflowTemplateDraftsStore = { load: jest.fn(), ready: 'store-ready' };
    const workflowTemplatesStore = { load: jest.fn(), ready: 'store-ready' };
    expect(
      renderer
        .create(
          <Provider
            workflowTemplateDraftsStore={workflowTemplateDraftsStore}
            workflowTemplatesStore={workflowTemplatesStore}
          >
            <CreateWorkflowTemplateDraft.WrappedComponent
              workflowTemplateDraftsStore={workflowTemplateDraftsStore}
              workflowTemplatesStore={workflowTemplatesStore}
              onCancel={onCancel}
              className={className}
            />
          </Provider>,
        )
        .toJSON(),
    ).toMatchSnapshot();
  });
});
