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

export default DbQuery;
declare class DbQuery {
    constructor(log: Console, client: any);
    log: Console;
    client: any;
    sortKeyName: any;
    params: {};
    table(name: any): DbQuery;
    index(name: any): DbQuery;
    props(...args: any[]): DbQuery;
    key(name: any, value: any): DbQuery;
    sortKey(name: any): DbQuery;
    eq(value: any): DbQuery;
    lt(value: any): DbQuery;
    lte(value: any): DbQuery;
    gt(value: any): DbQuery;
    gte(value: any): DbQuery;
    between(value1: any, value2: any): DbQuery;
    begins(value: any): DbQuery;
    _internalExpression(expr: any, value: any): DbQuery;
    _setCondition(expression: any): void;
    start(key: any): DbQuery;
    filter(str: any): DbQuery;
    strong(): DbQuery;
    names(obj?: {}): DbQuery;
    values(obj?: {}): DbQuery;
    projection(expr: any): DbQuery;
    select(str: any): DbQuery;
    limit(num: any): DbQuery;
    forward(yesOrNo?: boolean): DbQuery;
    capacity(str?: string): DbQuery;
    query<T = any>(): Promise<T[]>;
    queryPage<T = any>(nextToken: string): Promise<{
        items: T[];
        nextToken: string;
    }>;
}
