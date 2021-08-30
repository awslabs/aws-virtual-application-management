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

export default DbDeleter;
declare class DbDeleter {
    constructor(log: Console, client: any);
    log: Console;
    client: any;
    params: {};
    table(name: any): DbDeleter;
    key(...args: any[]): DbDeleter;
    props(...args: any[]): DbDeleter;
    condition(str: any): DbDeleter;
    names(obj?: {}): DbDeleter;
    values(obj?: {}): DbDeleter;
    return(str: any): DbDeleter;
    capacity(str?: string): DbDeleter;
    metrics(str: any): DbDeleter;
    delete(): Promise<any>;
    /**
     * To be used in a transactWrite update.
     * @returns {Object}
     */
    asTransactionItem(): any;
}
