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

export default UserCapabilitiesService;
declare class UserCapabilitiesService {
    init(): Promise<void>;
    _getter: () => any;
    _updater: () => any;
    _query: () => any;
    _deleter: () => any;
    _scanner: () => any;
    find(_requestContext: any, { id, fields }: {
        id: any;
        fields?: any[];
    }): Promise<any>;
    mustFind(requestContext: any, { id, fields }: {
        id: any;
        fields?: any[];
    }): Promise<any>;
    create(requestContext: any, userCapability: any): Promise<any>;
    update(requestContext: any, rawData: any): Promise<any>;
    delete(requestContext: any, { id }: {
        id: any;
    }): Promise<any>;
    list({ maxResults, nextToken, fields }?: {
        maxResults?: number;
        nextToken: any;
        fields?: any[];
    }): Promise<any>;
    _fromRawToDbObject(rawObject: any, overridingProps?: {}): any;
    _fromDbToDataObject(rawDb: any, overridingProps?: {}): any;
    audit(requestContext: any, auditEvent: any): Promise<any>;
    assertAuthorized(requestContext: any, { action, conditions }: {
        action: any;
        conditions: any;
    }, ...args: any[]): Promise<void>;
}
