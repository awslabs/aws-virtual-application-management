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

import apiHandlerServicesPlugin from './api-handler/plugins/services-plugin';
import { userManagementPlugin as apiHandlerUserManagementPlugin } from './api-handler/plugins/user-management-plugin';

import authnHandlerServicesPlugin from './authn-handler/plugins/services-plugin';
import { userManagementPlugin as authnHandlerUserManagementPlugin } from './authn-handler/plugins/user-management-plugin';

export default {
  apiHandler: {
    servicesPlugin: apiHandlerServicesPlugin,
    userManagementPlugin: apiHandlerUserManagementPlugin,
  },
  authnHandler: {
    servicesPlugin: authnHandlerServicesPlugin,
    userManagementPlugin: authnHandlerUserManagementPlugin,
  },
};
