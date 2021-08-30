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

/**
 * This file is used to require in the global schema resources for the global EventBridge bus.
 *
 * The global schema template is defined in the EventBridge addon.
 * Other addons contribute their schemas via the 'eventbridge' plugin extension point.
 *
 * Serverless will be able to resolve the value through the use of async variables (https://www.serverless.com/blog/serverless-v1.13.0)
 */
import { SchemaContainer } from '@aws-ee/eventbridge-services';

import pluginRegistry from '@aws-ee/main-registry-eventbridge-infra';

const schemaContainer = new SchemaContainer(pluginRegistry);
const cfTemplate = schemaContainer.getSchemasAsCloudFormationResources('solution');

export { cfTemplate };
export default cfTemplate;
