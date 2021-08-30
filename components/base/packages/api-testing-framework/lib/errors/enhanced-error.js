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

const _ = require('lodash');

/**
 * The purpose of this class is to allow us to create error objects with extra information, such as
 * errorCode.
 */
class EnhancedError extends Error {
  /**
   * @param msg Error message, make the error message user friendly as much as possible.
   * If you pass an Error instance, then its message is used and it is assigned as the root cause.
   * @param errorCode should be a string (camelCase) to spaces and should make unit testing easier.
   * This is because unit tests can check against the errorCode instead of the exact error message content.
   */
  constructor(errorCode, msg = '') {
    super(_.isError(msg) ? msg.message : _.get(msg, 'message', msg));
    this.errorCode = errorCode;

    if (_.isError(msg)) {
      this.root = msg;
    }
  }

  cause(root) {
    this.root = root;
    return this;
  }
}

module.exports = EnhancedError;
