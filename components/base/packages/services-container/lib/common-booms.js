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

const CommonBooms = {
  badRequest: { code: 'badRequest', status: 400 },

  concurrentUpdate: { code: 'concurrentUpdate', status: 400 },

  unauthorized: { code: 'unauthorized', status: 401 },

  forbidden: { code: 'forbidden', status: 403 },

  invalidToken: { code: 'invalidToken', status: 403 },

  notFound: { code: 'notFound', status: 404 },

  alreadyExists: { code: 'alreadyExists', status: 400 },

  outdatedUpdateAttempt: { code: 'outdatedUpdateAttempt', status: 409 },

  timeout: { code: 'timeout', status: 408 },

  badImplementation: { code: 'badImplementation', status: 500 },

  internalError: { code: 'internalError', status: 500 },
};

export default CommonBooms;
