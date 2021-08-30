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

export default DbScanner;
declare class DbScanner {
    constructor(log: Console, client: any);
    log: Console;
    client: any;
    params: {};
    table(name: any): DbScanner;
    index(name: any): DbScanner;
    props(...args: any[]): DbScanner;
    start(key: any): DbScanner;
    filter(str: any): DbScanner;
    strong(): DbScanner;
    names(obj?: {}): DbScanner;
    values(obj?: {}): DbScanner;
    projection(expr: any): DbScanner;
    select(str: any): DbScanner;
    limit(num: any): DbScanner;
    segment(num: any): DbScanner;
    totalSegment(num: any): DbScanner;
    capacity(str?: string): DbScanner;
    scan(): Promise<any>;
    scanPage(nextToken: any): Promise<{
        items: any;
        nextToken: any;
    }>;
}
