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

import { allow, deny } from '../authorization/authorization-utils';

function allowIfHasPermissionFactory({
  permissionService,
  principalTransformFn = requestContext => [requestContext.principalIdentifier.uid],
  actionTransformFn = action => action,
  resourceTransformFn = resource => [resource.id],
}) {
  return async (requestContext, { action: rawAction }, resource) => {
    const principals = principalTransformFn(requestContext);
    // The permission service will return unique ids, so the resources returned here should be unique
    const resources = resourceTransformFn(resource);
    const action = actionTransformFn(rawAction);

    const allowedResourceIds = await permissionService.batchVerifyPrincipalsPermission(requestContext, {
      principals,
      resources,
      action,
    });

    // Deny if the principals don't have permission to all resources
    if (allowedResourceIds.length !== resources.length) {
      return deny(`Cannot perform the specified action "${action}".`);
    }
    return allow();
  };
}

export { allowIfHasPermissionFactory };
