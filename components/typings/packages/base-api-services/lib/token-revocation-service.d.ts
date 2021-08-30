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

export default TokenRevocationService;
declare class TokenRevocationService {
    revoke(requestContext: any, { token }: {
        token: any;
    }): Promise<any>;
    isRevoked({ token }: {
        token: any;
    }): Promise<boolean>;
    exists({ token }: {
        token: any;
    }): Promise<boolean>;
    /**
     * A method responsible for translating token into a token revocation record in {id, ttl} format.
     *
     * @param token
     * @returns {Promise<{id, ttl}>}
     */
    toTokenRevocationRecord(token: any): Promise<{
        id;
        ttl;
    }>;
}
