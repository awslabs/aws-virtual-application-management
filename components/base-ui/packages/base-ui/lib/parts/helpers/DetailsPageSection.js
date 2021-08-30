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

import React, { Component } from 'react';
import { Header, Segment, Button } from 'semantic-ui-react';

class DetailsPageSection extends Component {
  render() {
    const { title, content, actions } = this.props;
    return (
      <Segment>
        <div className="flex">
          <Header as="h2" color="grey" className="flex-auto mb0">
            {title}
          </Header>
          {this.renderSectionActions(actions)}
        </div>
        {content}
      </Segment>
    );
  }

  renderSectionActions(actions) {
    if (actions) {
      return (
        <>
          {actions.map((action, index) => {
            return (
              // eslint-disable-next-line react/no-array-index-key
              <Button key={index} onClick={action.action} basic size="mini" color="blue">
                {action.label}
              </Button>
            );
          })}
        </>
      );
    }
    return null;
  }
}

export default DetailsPageSection;
