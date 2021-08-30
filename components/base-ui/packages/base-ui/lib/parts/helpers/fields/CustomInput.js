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

import _ from 'lodash';
import React from 'react';
import { observer } from 'mobx-react';
import c from 'classnames';

import Header from './Header';
import Description from './Description';
import ErrorPointer from './ErrorPointer';

const CustomInput = observer(props => {
  const { field, className = 'mb4', showHeader = true, disabled = false, children } = props;
  const { value, sync, error = '' } = field;
  const hasError = !_.isEmpty(error); // IMPORTANT do NOT use field.hasError
  const isDisabled = field.disabled || disabled;
  const disabledClass = isDisabled ? 'disabled' : '';
  const errorClass = hasError ? 'error' : '';
  const attrs = {
    disabled: isDisabled,
    error: hasError,
    value,
    onChange: v => {
      sync(v.value);
      field.validate({ showErrors: true });
    },
  };

  const finalProps = { ...attrs, ...children.props };

  return (
    <div className={c(className, errorClass, disabledClass)}>
      {showHeader && <Header field={field} />}
      <Description field={field} />
      <children.type {...finalProps} />
      <ErrorPointer field={field} />
    </div>
  );
});

export default CustomInput;
