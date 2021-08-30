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

export default PermissionService;
declare class PermissionService {
    init(): Promise<void>;
    _getter: () => any;
    _updater: () => any;
    _query: () => any;
    _deleter: () => any;
    resourceIndexName: any;
    /**
     * Find an item in the table querying exactly if the principal has the action for the resource.
     *
     * @param  {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param  {Object} findParams
     * @param  {string} findParams.principal A unique identifier for the principal.
     * @param  {string} findParams.resource A unique identifier for the resource.
     * @param  {string} findParams.action A string representing the action (eg. read, admin, write).
     * @param  {string[]} [findParams.fields] The fields to fetch from the item.
     *
     * @returns {Promise<Object|undefined>} The item from the table.
     */
    find(requestContext: any, { principal, resource, action, fields }: {
        principal: string;
        resource: string;
        action: string;
        fields: string[];
    }): Promise<any | undefined>;
    /**
     * Verify if the principal has the permission specified by the action for the resource.
     * If the item is found, then it is returned. Otherwise a not found error is thrown.
     *
     * @param  {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param  {Object} verifyParams
     * @param  {string} verifyParams.principal A unique identifier for the principal.
     * @param  {string} verifyParams.resource A unique identifier for the resource.
     * @param  {string} verifyParams.action A string representing the action (eg. read, admin, write).
     * @param  {string[]} [verifyParams.fields] The fields to fetch from the item.
     *
     * @throws {BoomError} With code notFound if the permission was not found.
     * @returns {Promise<Object|undefined>} The item from the table.
     */
    verifyPrincipalPermission(requestContext: any, { principal, resource, action, fields }: {
        principal: string;
        resource: string;
        action: string;
        fields: string[];
    }): Promise<any | undefined>;
    /**
     * Verifies if the principals have the permission specified by the action for a batch of resources.
     * An array of resources that the principal has access to is returned. Any principal matching
     * will result in a resource being permitted.
     *
     * @param  {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param  {Object} batchVerifyParams
     * @param  {string[]} batchVerifyParams.principals An array of identifiers for the principal.
     * These can represent different entities the underlying principal belongs to.
     * @param  {string[]} batchVerifyParams.resources An array of resource ids to check.
     * @param  {string} [batchVerifyParams.resourcePrefix] Optionally specify the prefix of the resource (eg. operation, dataset)
     * @param  {string} batchVerifyParams.action A string representing the action (eg. read, admin, write).
     * @param  {string[]} [batchVerifyParams.fields] The fields to fetch from the item.
     *
     * @returns {Promise<string[]>} The resource ids that the principal has permission for.
     */
    batchVerifyPrincipalsPermission(_requestContext: any, { principals, resources, resourcePrefix, action }?: {
        principals: string[];
        resources: string[];
        resourcePrefix: string;
        action: string;
        fields: string[];
    }): Promise<string[]>;
    create(requestContext: any, permission: any): Promise<{
        action: any;
        principal: any;
        resource: any;
    }>;
    /**
     * Ensures that the principals have the permission specified by the action for resource.
     * This method will not throw if the permission already exists.
     *
     * @param  {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param  {Object} ensurePermissionsParams
     * @param  {string[]} ensurePermissionsParams.principals An array of identifiers for the principal.
     * These can represent different entities the underlying principal belongs to.
     * @param  {string} ensurePermissionsParams.resource A unique resource id.
     * @param  {string} ensurePermissionsParams.action A string representing the action (eg. read, admin, write).
     * @param  {string[]} [ensurePermissionsParams.fields] The fields to fetch from the item.
     *
     * @returns {Promise<void>}
     */
    ensurePermissions(requestContext: any, { principals, resource, action }: {
        principals: string[];
        resource: string;
        action: string;
        fields: string[];
    }): Promise<void>;
    delete(requestContext: any, permission: any): Promise<any>;
    /**
     * Deletes permission for the principals specified by the action for resource.
     *
     * @param  {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param  {Object} deletePermissionsParams
     * @param  {string[]} deletePermissionsParams.principals An array of identifiers for the principal.
     * These can represent different entities the underlying principal belongs to.
     * @param  {string} deletePermissionsParams.resource A unique resource id.
     * @param  {string} deletePermissionsParams.action A string representing the action (eg. read, admin, write).
     * @param  {string[]} [deletePermissionsParams.fields] The fields to fetch from the item.
     *
     * @returns {Promise<void>}
     */
    deletePermissions(requestContext: any, { principals, resource, action }: {
        principals: string[];
        resource: string;
        action: string;
        fields: string[];
    }): Promise<void>;
    /**
     * List principals that have a particular permission (action) for a resource
     *
     * @param  {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param  {Object} listPrincipalsParams
     * @param  {string} [listPrincipalsParams.principalPrefix] Optionally specify the prefix of the principal (user, organization, group).
     * @param  {string[]} listPrincipalsParams.resource The resource id to check.
     * @param  {string} listPrincipalsParams.action A string representing the action (eg. read, admin, write).
     * @param  {string[]} [listPrincipalsParams.fields] The fields to fetch from the item.
     *
     * @returns {Promise<Object[]>} The items representing permission for each matching principal.
     */
    listPrincipalsWithActionForResource(requestContext: any, { resource, principalPrefix, action, fields }?: {
        principalPrefix: string;
        resource: string[];
        action: string;
        fields: string[];
    }): Promise<any[]>;
    /**
     * List resources for which a principal has a particular permission (action).
     *
     * @param  {Object} requestContext Request context object, as defined in
     * `@aws-ee/base-services-container/lib/request-context`.
     * @param  {Object} listResourcesParams
     * @param  {string} listResourcesParams.principal A unique identifier for the principal.
     * @param  {string} [listResourcesParams.resourcePrefix] Optionally specify the prefix of the resource (eg. operation, dataset)
     * @param  {string} listResourcesParams.action A string representing the action (eg. read, admin, write)
     * @param  {string[]} [listResourcesParams.fields] The fields to fetch from the item
     *
     * @returns {Promise<Object[]>} The items representing permission for each matching principal
     */
    listResourcesWithActionForPrincipal(requestContext: any, { principal, resourcePrefix, action, fields }?: {
        principal: string;
        resourcePrefix: string;
        action: string;
        fields: string[];
    }): Promise<any[]>;
    _transformResult({ action, principal, resourceId: resource }: {
        action: any;
        principal: any;
        resourceId: any;
    }): {
        action: any;
        principal: any;
        resource: any;
    };
    _fromDbToDataObject(rawDb: any, overridingProps?: {}): any;
    _assertAuthorized(requestContext: any, { action, conditions }: {
        action: any;
        conditions: any;
    }, ...args: any[]): Promise<void>;
}
