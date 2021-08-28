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

import { observer } from 'mobx-react';

// The tests prop takes an array of functions that may return a component.
// The tests are evaluated in order and the first component is returned.
// If no tests are truthy the fallback component is returned.
const ComponentSwitch = ({ tests, fallback = null }) =>
  tests.reduce((result, aTest) => result || aTest(), null) || fallback;

export default observer(ComponentSwitch);
