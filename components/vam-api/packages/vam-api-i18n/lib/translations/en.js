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

import keys from '../keys';

const en = {
  values: {
    [keys.INSTALL]: 'Install',
    [keys.EXISTING_DYNAMIC_CATALOG]: 'Dynamic Catalog with id "%{id}" already exists',
    [keys.DYNAMIC_CATALOG_NO_APPLICATIONS]: 'Dynamic Catalog with id "%{id}" does not contain any applications',
    [keys.DYNAMIC_CATALOG_NOT_FOUND]: 'Dynamic Catalog with id "%{id}" does not exist',
    [keys.IMAGE_NOT_FOUND]: 'Appstream Image not found',
    [keys.EXISTING_GROUP_ACCESS]: 'Group Access with id "%{groupId}" already exists',
    [keys.ERROR_REVOKING_GROUP_ACCESS]: 'There was an error revoking accessing for group with id "%{groupId}"',
    [keys.INVALID_DYNAMIC_CATALOG_FLEET]:
      'The Image attached to the fleet "%{fleet}" is not enabled for Dynamic Catalogs.',
    [keys.FLEET_NOT_FOUND]: 'The Fleet "%{fleetName}" could not be found.',
    [keys.DC_NOT_MATCHING_ENABLED]:
      'The current image is enabled for Dynamic Catalogs. The replacement Image must also be enabled.',
    [keys.DC_NOT_MATCHING_DISABLED]:
      'The current image is not enabled for Dynamic catalogs.  The replacement Image must also not be enabled.',
    [keys.MINIMUM_ONE_APPLICATION]: 'At least one application must be specified',
  },
};

export default en;
