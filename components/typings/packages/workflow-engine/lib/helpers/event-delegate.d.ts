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

export default EventDelegate;
declare class EventDelegate {
    constructor({ supportedEvents, sponsorName }?: {
        supportedEvents?: any[];
        sponsorName?: string;
    });
    supportedEvents: any[];
    sponsorName: string;
    listenersMap: {};
    on(name: any, fn: any): EventDelegate;
    fireEvent(name: any, ...params: any[]): Promise<void>;
}
