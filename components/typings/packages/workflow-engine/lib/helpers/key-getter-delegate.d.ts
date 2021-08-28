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

export default KeyGetterDelegate;
declare class KeyGetterDelegate {
    constructor(findFnAsync: any, { loadFn, storeTitle }?: {
        loadFn: any;
        storeTitle?: string;
    });
    findFnAsync: any;
    storeTitle: string;
    loadFn: any;
    string(key: any): Promise<any>;
    number(key: any): Promise<any>;
    boolean(key: any): Promise<any>;
    object(key: any): Promise<any>;
    array(key: any): Promise<any>;
    optionalString(key: any, defaults?: string): Promise<any>;
    optionalNumber(key: any, defaults?: number): Promise<any>;
    optionalBoolean(key: any, defaults?: boolean): Promise<any>;
    optionalObject(key: any, defaults?: {}): Promise<any>;
    optionalArray(key: any, defaults?: any[]): Promise<any>;
    getMethods(): {
        string: any;
        number: any;
        boolean: any;
        object: any;
        array: any;
        optionalString: any;
        optionalNumber: any;
        optionalBoolean: any;
        optionalObject: any;
        optionalArray: any;
    };
    value(key: any): Promise<any>;
    mustFind(key: any): Promise<any>;
}
