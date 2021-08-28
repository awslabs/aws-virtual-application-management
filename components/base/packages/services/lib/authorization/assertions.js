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
import { Boom } from '@aws-ee/base-services-container';

const boom = new Boom();

function isCurrentUser(requestContext, { uid }) {
  if (_.isEmpty(uid) || !_.isString(uid)) {
    return false;
  }

  return _.get(requestContext, 'principalIdentifier.uid') === uid;
}

async function ensureCurrentUserOrAdmin(requestContext, { uid }) {
  const isCurrentUserOrAdmin =
    isCurrentUser(requestContext, { uid }) || _.get(requestContext, 'principal.isAdmin', false);
  if (!isCurrentUserOrAdmin) {
    throw boom.forbidden('You are not authorized to perform this operation', true);
  }
}

async function ensureCurrentUser(requestContext, { uid }) {
  if (!isCurrentUser(requestContext, { uid })) {
    throw boom.forbidden('You are not authorized to perform this operation on another user', true);
  }
}

async function ensureAdmin(requestContext) {
  const isAdmin = _.get(requestContext, 'principal.isAdmin', false);
  if (!isAdmin) {
    throw boom.forbidden('You are not authorized to perform this operation', true);
  }
}

export { ensureCurrentUserOrAdmin, ensureAdmin, isCurrentUser, ensureCurrentUser };
