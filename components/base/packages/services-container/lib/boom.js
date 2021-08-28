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
import BoomError from './boom-error';
import CommonBooms from './common-booms';

class Boom {
  constructor() {
    this.extend(..._.keys(CommonBooms).map(key => [CommonBooms[key].code, CommonBooms[key].status]));
  }

  extend(...arr) {
    _.forEach(arr, item => {
      if (!_.isArray(item))
        throw new Error(
          `You tried to extend boom, but one of the elements you provided is not an array "${item}". You need to pass an array of arrays.`,
        );
      this[item[0]] = (msg, safe) => new BoomError(msg, safe, item[0], item[1]);
    });
  }

  is(error, code) {
    return (error || {}).boom && error.code === code;
  }

  code(error) {
    return (error || {}).code || '';
  }
}

export default Boom;
