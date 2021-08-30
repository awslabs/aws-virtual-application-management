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

export default DbPasswordService;
declare class DbPasswordService {
    passwordMatchesPasswordPolicy(password: any): Promise<boolean>;
    assertValidPassword(password: any): Promise<void>;
    savePassword(requestContext: any, { username, password, uid }: {
        username: any;
        password: any;
        uid: any;
    }): Promise<void>;
    deletePassword(requestContext: any, { username, uid }: {
        username: any;
        uid: any;
    }): Promise<void>;
    exists({ username, password }: {
        username: any;
        password: any;
    }): Promise<false | {
        uid: any;
        exists: boolean;
    }>;
    hash({ password, salt }: {
        password: any;
        salt: any;
    }): any;
}
