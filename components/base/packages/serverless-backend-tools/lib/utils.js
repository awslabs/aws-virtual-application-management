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
import { inspect } from 'util';

// a promise friendly delay function
function delay(seconds) {
  return new Promise(resolve => {
    _.delay(resolve, seconds * 1000);
  });
}

function formatObject(obj) {
  return inspect(obj, { showHidden: false, depth: 7 });
}

export { delay, formatObject };
