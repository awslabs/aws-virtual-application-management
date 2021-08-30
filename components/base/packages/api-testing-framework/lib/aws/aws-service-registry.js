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

const errors = require('../errors/error-messages');
const { Registry, registryWrapper } = require('../helpers/registry');

/**
 * A registry for classes that implement AWS service helpers.  These services become available during the
 * tests as aws.services.*
 * In addition, the registry captures information regarding the source of these classes, this allows us to list where each
 * aws service came from and which component overrides another component's contribution.
 */
class AwsServiceRegistry extends Registry {
  errorInvalidSource(key, value) {
    return errors.awsServiceSourceInvalid(key, value);
  }

  errorKeyOrValueNotProvided(key) {
    return errors.awsServiceNotProvided(key);
  }

  errorKeyNotFound(key) {
    return errors.awsServiceNotAvailable(key);
  }
}

module.exports = { AwsServiceRegistry, registryWrapper };
