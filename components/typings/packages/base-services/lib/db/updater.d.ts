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

export default DbUpdater;
declare class DbUpdater {
    constructor(log: Console, client: any);
    log: Console;
    client: any;
    params: {
        ReturnValues: string;
    };
    marked: {};
    createdAtState: {
        enabled: boolean;
        processed: boolean;
        value: string;
    };
    updatedAtState: {
        enabled: boolean;
        processed: boolean;
        value: string;
    };
    internals: {
        set: any[];
        add: any[];
        remove: any[];
        delete: any[];
        revGiven: boolean;
        setConditionExpression: (expr: any, separator?: string) => void;
        toParams(): {
            ReturnValues: string;
        };
    };
    table(name: any): DbUpdater;
    mark(arr?: any[]): DbUpdater;
    key(...args: any[]): DbUpdater;
    props(...args: any[]): DbUpdater;
    disableCreatedAt(): DbUpdater;
    createdAt(str: any): DbUpdater;
    disableUpdatedAt(): DbUpdater;
    updatedAt(str: any): DbUpdater;
    rev(rev: any): DbUpdater;
    item(item: any): DbUpdater;
    set(expression: any): DbUpdater;
    add(expression: any): DbUpdater;
    remove(expression: any): DbUpdater;
    delete(expression: any): DbUpdater;
    names(obj?: {}): DbUpdater;
    values(obj?: {}): DbUpdater;
    condition(str: any, separator?: string): DbUpdater;
    return(str: any): DbUpdater;
    metrics(str: any): DbUpdater;
    capacity(str?: string): DbUpdater;
    update<T = any>(): Promise<T>
    /**
     * To be used in a transactWrite update.
     * @returns {Object}
     */
    asTransactionItem(): any;
}
