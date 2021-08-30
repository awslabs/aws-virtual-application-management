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

export default UserRolesMap;
declare namespace UserRolesMap {
    export { ADMIN };
    export { GUEST };
}
declare namespace ADMIN {
    const id: string;
    const description: string;
    const userType: string;
    const capabilities: any[];
}
declare namespace GUEST {
    const id_1: string;
    export { id_1 as id };
    const description_1: string;
    export { description_1 as description };
    const userType_1: string;
    export { userType_1 as userType };
    const capabilities_1: any[];
    export { capabilities_1 as capabilities };
}
