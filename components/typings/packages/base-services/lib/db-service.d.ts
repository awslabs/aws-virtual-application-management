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

import { Service } from '@aws-ee/base-services-container';

export default DbService;
declare class DbService extends Service {
    init(): Promise<void>;
    dynamoDb: any;
    client: any;
    helper: {
        unmarshal: typeof unmarshal;
        scanner: () => Scanner;
        updater: () => Updater;
        getter: () => Getter;
        query: () => Query;
        deleter: () => Deleter;
    };
}
import unmarshal from "./db/unmarshal";
import Scanner from "./db/scanner";
import Updater from "./db/updater";
import Getter from "./db/getter";
import Query from "./db/query";
import Deleter from "./db/deleter";
