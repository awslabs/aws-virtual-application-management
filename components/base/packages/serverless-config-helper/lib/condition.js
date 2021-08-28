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

const evalCondition = value =>
  _.template(value)({
    eq: (a, b) => a === b,
    neq: (a, b) => a !== b,
    lt: (a, b) => a < b,
    le: (a, b) => a <= b,
    ge: (a, b) => a >= b,
    gt: (a, b) => a > b,
    and: (a, b) => a && b,
    or: (a, b) => a || b,
    not: a => !a,
    identity: a => a,
  }) === 'true';

export { evalCondition };
