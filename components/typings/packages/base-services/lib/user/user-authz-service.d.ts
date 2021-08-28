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

export default UserAuthzService;
declare class UserAuthzService {
    authorize(requestContext: any, { resource, action, effect, reason }: {
        resource: any;
        action: any;
        effect: any;
        reason: any;
    }, ...args: any[]): Promise<{
        resource: any;
        action: any;
        effect: any;
        reason: any;
    } | {
        effect: any;
        resource?: undefined;
        action?: undefined;
        reason?: undefined;
    }>;
    authorizeCreate(requestContext: any, { action }: {
        action: any;
    }): Promise<{
        effect: string;
    }>;
    authorizeCreateBulk(requestContext: any, { action }: {
        action: any;
    }): Promise<{
        effect: string;
    }>;
    authorizeDelete(requestContext: any, { action }: {
        action: any;
    }, user: any): Promise<{
        effect: string;
    }>;
    authorizeUpdate(requestContext: any, { action }: {
        action: any;
    }, user: any): Promise<{
        effect: string;
    }>;
    authorizeUpdateAttributes(requestContext: any, { action }: {
        action: any;
    }, user: any, existingUser: any): Promise<{
        effect: string;
    }>;
}
