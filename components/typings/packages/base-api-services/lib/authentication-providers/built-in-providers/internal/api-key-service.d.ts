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

export default ApiKeyService;
declare class ApiKeyService {
    init(): Promise<void>;
    internals: {
        dbGetter: () => any;
        dbUpdater: () => any;
        dbQuery: () => any;
        ensureMaxApiKeysLimitNotReached: (requestContext: any, { uid }: {
            uid: any;
        }) => Promise<void>;
    };
    createApiKeyMaterial(requestContext: any, { apiKeyId, uid, expiryTime }: {
        apiKeyId: any;
        uid: any;
        expiryTime: any;
    }): Promise<any>;
    revokeApiKey(requestContext: any, { uid, keyId }: {
        uid: any;
        keyId: any;
    }): Promise<any>;
    issueApiKey(requestContext: any, { uid, expiryTime }: {
        uid: any;
        expiryTime: any;
    }): Promise<any>;
    validateApiKey(signedApiKey: any): Promise<{
        verifiedToken: any;
        uid: any;
    }>;
    getApiKeys(requestContext: any, { uid }: {
        uid: any;
    }): Promise<any>;
    getApiKey(requestContext: any, { uid, keyId }: {
        uid: any;
        keyId: any;
    }): Promise<any>;
    isApiKeyToken(decodedToken: any): Promise<boolean>;
}
